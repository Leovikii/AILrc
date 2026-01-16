package main

import (
	"bufio"
	"bytes"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"github.com/saintfish/chardet"
	"golang.org/x/text/encoding/japanese"
	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/encoding/traditionalchinese"
	"golang.org/x/text/transform"
)

type LyricLine struct {
	Time     int64  `json:"time"`
	MainText string `json:"mainText"`
	SubText  string `json:"subText"`
}

type cacheEntry struct {
	ModTime time.Time
	Lyrics  []LyricLine
}

var (
	lrcRegex       = regexp.MustCompile(`\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]`)
	srtVttRegex    = regexp.MustCompile(`(\d{1,2}):(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?`)
	bracketRegex   = regexp.MustCompile(`^(.*?)\s*[(（【\[](.*?)[)）】\]]\s*$`)
	delimiterRegex = regexp.MustCompile(`^(.*?)\s*[/]\s*(.*)$`)

	lyricCache = make(map[string]cacheEntry)
	cacheMutex sync.RWMutex
)

func LoadLyrics(audioPath string) []LyricLine {
	if audioPath == "" {
		return nil
	}

	lyricPath := findLyricFile(audioPath)
	if lyricPath == "" {
		return nil
	}

	info, err := os.Stat(lyricPath)
	if err != nil {
		return nil
	}

	cacheMutex.RLock()
	entry, found := lyricCache[lyricPath]
	cacheMutex.RUnlock()

	if found && entry.ModTime.Equal(info.ModTime()) {
		return entry.Lyrics
	}

	content, err := readAndDecode(lyricPath)
	if err != nil {
		return nil
	}

	lyrics := parseGeneralLyrics(content)

	cacheMutex.Lock()
	lyricCache[lyricPath] = cacheEntry{
		ModTime: info.ModTime(),
		Lyrics:  lyrics,
	}
	cacheMutex.Unlock()

	return lyrics
}

func findLyricFile(audioPath string) string {
	dir := filepath.Dir(audioPath)
	audioBase := filepath.Base(audioPath)
	audioExt := filepath.Ext(audioBase)
	nameWithoutExt := strings.TrimSuffix(audioBase, audioExt)

	candidates := []string{
		audioBase + ".lrc",
		audioBase + ".srt",
		audioBase + ".vtt",
		nameWithoutExt + ".lrc",
		nameWithoutExt + ".srt",
		nameWithoutExt + ".vtt",
	}

	for _, name := range candidates {
		path := filepath.Join(dir, name)
		if _, err := os.Stat(path); err == nil {
			return path
		}
	}

	entries, err := os.ReadDir(dir)
	if err != nil {
		return ""
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		lowerName := strings.ToLower(name)
		lowerTarget := strings.ToLower(nameWithoutExt)

		if (strings.HasSuffix(lowerName, ".lrc") || strings.HasSuffix(lowerName, ".srt") || strings.HasSuffix(lowerName, ".vtt")) &&
			strings.Contains(lowerName, lowerTarget) {
			return filepath.Join(dir, name)
		}
	}

	return ""
}

func readAndDecode(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}

	if len(data) == 0 {
		return "", nil
	}

	if bytes.HasPrefix(data, []byte{0xEF, 0xBB, 0xBF}) {
		data = data[3:]
		return string(data), nil
	}

	if utf8.Valid(data) {
		return string(data), nil
	}

	detector := chardet.NewTextDetector()
	result, err := detector.DetectBest(data)

	if err != nil {
		return decode(data, simplifiedchinese.GBK.NewDecoder())
	}

	switch result.Charset {
	case "UTF-8":
		return string(data), nil
	case "Shift_JIS":
		return decode(data, japanese.ShiftJIS.NewDecoder())
	case "GB-18030", "GBK", "Big5":
		if result.Charset == "Big5" {
			return decode(data, traditionalchinese.Big5.NewDecoder())
		}
		return decode(data, simplifiedchinese.GBK.NewDecoder())
	case "EUC-JP":
		return decode(data, japanese.EUCJP.NewDecoder())
	case "ISO-8859-1":
		return decode(data, simplifiedchinese.GBK.NewDecoder())
	}

	return string(data), nil
}

func decode(data []byte, transformer transform.Transformer) (string, error) {
	r := transform.NewReader(bytes.NewReader(data), transformer)
	decoded, err := io.ReadAll(r)
	if err != nil {
		return string(data), err
	}
	return string(decoded), nil
}

func parseGeneralLyrics(text string) []LyricLine {
	type tempLine struct {
		Time int64
		Text string
	}
	var rawLines []tempLine

	scanner := bufio.NewScanner(strings.NewReader(text))

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}

		lrcMatches := lrcRegex.FindAllStringSubmatch(line, -1)
		if len(lrcMatches) > 0 {
			content := lrcRegex.ReplaceAllString(line, "")
			content = strings.TrimSpace(content)

			for _, match := range lrcMatches {
				min, _ := strconv.Atoi(match[1])
				sec, _ := strconv.Atoi(match[2])
				ms := 0
				if len(match) > 3 && match[3] != "" {
					ms, _ = strconv.Atoi(match[3])
					if len(match[3]) == 2 {
						ms *= 10
					}
				}
				rawLines = append(rawLines, tempLine{
					Time: int64(min*60000 + sec*1000 + ms),
					Text: content,
				})
			}
			continue
		}

		srtMatches := srtVttRegex.FindStringSubmatch(line)
		if len(srtMatches) > 0 {
			hr, _ := strconv.Atoi(srtMatches[1])
			min, _ := strconv.Atoi(srtMatches[2])
			sec, _ := strconv.Atoi(srtMatches[3])
			ms := 0
			if len(srtMatches) > 4 && srtMatches[4] != "" {
				ms, _ = strconv.Atoi(srtMatches[4])
			}
			startTime := int64(hr*3600000 + min*60000 + sec*1000 + ms)

			var textBuilder strings.Builder
			for scanner.Scan() {
				subLine := strings.TrimSpace(scanner.Text())
				if subLine == "" {
					break
				}
				if _, err := strconv.Atoi(subLine); err == nil && textBuilder.Len() == 0 {
					continue
				}

				if textBuilder.Len() > 0 {
					textBuilder.WriteString("\n")
				}
				textBuilder.WriteString(subLine)
			}

			if textBuilder.Len() > 0 {
				rawLines = append(rawLines, tempLine{
					Time: startTime,
					Text: textBuilder.String(),
				})
			}
		}
	}

	sort.SliceStable(rawLines, func(i, j int) bool {
		return rawLines[i].Time < rawLines[j].Time
	})

	var lyrics []LyricLine
	const MergeThreshold = 200

	for i := 0; i < len(rawLines); i++ {
		curr := rawLines[i]

		if i > 0 && abs(curr.Time-rawLines[i-1].Time) < MergeThreshold {
			lastIdx := len(lyrics) - 1
			if lastIdx >= 0 {
				if lyrics[lastIdx].MainText == curr.Text || lyrics[lastIdx].SubText == curr.Text {
					continue
				}

				if lyrics[lastIdx].SubText == "" {
					lyrics[lastIdx].SubText = curr.Text
				} else {
					lyrics[lastIdx].SubText += "\n" + curr.Text
				}
				continue
			}
		}

		mainText := curr.Text
		subText := ""

		if matches := bracketRegex.FindStringSubmatch(curr.Text); len(matches) == 3 {
			mainText = strings.TrimSpace(matches[1])
			subText = strings.TrimSpace(matches[2])
		} else if matches := delimiterRegex.FindStringSubmatch(curr.Text); len(matches) == 3 {
			mainText = strings.TrimSpace(matches[1])
			subText = strings.TrimSpace(matches[2])
		}

		lyrics = append(lyrics, LyricLine{
			Time:     curr.Time,
			MainText: mainText,
			SubText:  subText,
		})
	}

	return lyrics
}

func abs(x int64) int64 {
	if x < 0 {
		return -x
	}
	return x
}
