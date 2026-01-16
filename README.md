# AILrc

**AILrc** is a modern, high-performance desktop lyric widget designed for Windows. Built with **Wails** (Go) and **React**, it combines the native performance of a backend with the beautiful, fluid UI of a web frontend.

![AILrc Screenshot](https://via.placeholder.com/800x400?text=AILrc+Screenshot)

## ✨ Key Features

* **Glassmorphism Design**: Fully integrated with Windows 11 aesthetics, featuring a responsive acrylic/frosted glass background and rounded corners.
* **Silky Smooth Animations**: Experience zero-latency transitions when resizing windows, switching modes, or adjusting settings. No jitter, just fluid motion.
* **Interactive Settings**: A dedicated, overlay-style settings panel to fine-tune font size (pt), colors, glow effects, and window dimensions.
* **Focus Mode**: Supports window locking and click-through, ensuring it never interferes with your workflow.
* **Smart Resizing**: Automatically adapts window height based on lyric content while maintaining your preferred width.

## 🛠 Tech Stack

* **Backend**: Go (Wails Framework)
* **Frontend**: React, TypeScript, Tailwind CSS
* **System**: Uses native Windows APIs for blur effects and window management.

## 🚀 Getting Started

### Prerequisites

* Go 1.18+
* Node.js 16+
* Wails CLI

### Installation & Build

1.  Clone the repository:
    ```bash
    git clone [https://github.com/yourusername/AILrc.git](https://github.com/yourusername/AILrc.git)
    cd AILrc
    ```

2.  Install frontend dependencies:
    ```bash
    cd frontend
    npm install
    ```

3.  Run in development mode:
    ```bash
    wails dev
    ```

4.  Build for production:
    ```bash
    wails build
    ```

## ⚙️ Configuration

AILrc automatically saves your preferences to `config.json`. You can customize:
* **Typography**: Font size, text opacity, fill color, and glow color.
* **Window**: Custom window width and background opacity.

## 📝 License

This project is open-sourced under the MIT License.