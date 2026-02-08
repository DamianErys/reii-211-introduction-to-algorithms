
# IDE Setup Guide

Before we dive into algorithms, you need to set up your environment. We have two primary recommendations—choose the one that fits your workflow best.

---

## 1. Choose Your IDE


### Option A: PyCharm (Pro-Grade)
[https://www.jetbrains.com/pycharm/](https://www.jetbrains.com/pycharm/)

### Option B: VSCode (Highly Recommended)
[https://code.visualstudio.com/](https://code.visualstudio.com/)

---

## Comparison

| **PyCharm (Student Edition)** | **Visual Studio Code** |
|------------------------------|-------------------------|
| Purpose-built for Python     | Lightweight and fast    |
| Industry-leading debugger    | The “Swiss Army Knife” of editors |
| Free with your university email | Preferred for this module |

---

## 2. Install Python & VSCode

{% tabs %}
{% tab title="Windows" %}
### Installation
1. **VSCode:** Open the **Microsoft Store**, search for "Visual Studio Code," and click **Install**.
2. **Python:** Search the Store for **"Python 3.12"** (or latest) and click **Install**.

### Terminal Fix
If you get an execution policy error in the terminal, run this in PowerShell as Admin:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

```

{% endtab %}

{% tab title="Linux" %}

### Installation

Python is usually pre-installed. Verify with `python3 --version`.

**Ubuntu/Debian:**

```bash
sudo apt install code python3

```

**Fedora/RHEL:**

```bash
sudo dnf install code python3

```

{% endtab %}

{% tab title="macOS" %}

### Installation

1. Download the VSCode `.zip` from the [official site](https://code.visualstudio.com/).
2. Drag it to your **Applications** folder.
3. Install Python via [python.org](https://www.google.com/search?q=https://www.python.org/downloads/macos/) or via Homebrew: `brew install python`
{% endtab %}
{% endtabs %}

---

## 3. Configuration & Extensions

Open VSCode and press `Ctrl+Shift+X` to open the Extensions marketplace. Install these:

* **Python** (by Microsoft) — *Required*
* **Python Debugger** (by Microsoft) — *Required*
* **Jupyter** (by Microsoft) — *Highly Recommended for the Onramp*

---

Here you go — the full response rewritten **purely in Markdown**, clean and ready to paste into GitBook.

---

## 4. Verification: Hello World

To ensure everything is working, create a file named `hello.py` and paste the following:

```python
print("Hello world!\n")
print("Name: YOUR_NAME_HERE")
print("Student Number: YOUR_STUDENT_NUMBER_HERE")
```

---

## How to Create a New File (Beginner‑Friendly)

Here are the simplest and more detailed methods.

### **Fastest Method (Works in Most Editors)**

**Keyboard shortcut:**  
- **Ctrl + N** → create a new file  
- **Ctrl + S** → save it as `hello.py`

This is the quickest, universal method.

---

## Creating a New File in VS Code

### **Method 1: Using the Explorer Panel**
1. Open VS Code  
2. Click the **Explorer** icon on the left  
3. Click **New File**  
4. Type `hello.py`  
5. Paste the code and save

### **Method 2: Using the Menu**
1. **File → New Text File**  
2. Paste the code  
3. **File → Save As…**  
4. Name it `hello.py`

---

## Creating a New File in PyCharm

### **Method 1: Right‑Click Method**
1. In the **Project** panel, right‑click the folder where you want the file  
2. Select **New → Python File**  
3. Enter `hello` (PyCharm adds `.py` automatically)  
4. Paste the code

### **Method 2: Menu Method**
1. **File → New… → Python File**  
2. Name it `hello`  
3. Paste the code

**To Run:** Click the **Play Button** in the top-right corner. If prompted, select the "Recommended" Python Interpreter.

### Submission Requirements

**What to submit**: A screenshot or text copy of your terminal output showing:
1. The "Hello world!" message
2. Your name
3. Your student number
4. Show your full IDE setup
---

## 5. Our Philosophy on AI Tools

{% hint style="info" %}
**Understanding > Syntax**
Tools like **GitHub Copilot** are incredible boosters. For this module, feel free to use AI for boilerplate code. What matters is that **you** understand the logic, the efficiency ( notation), and the "Why."

If the AI writes the algorithm for you and you can't explain how it works, you haven't learned the material. Use it as a tutor, not a ghostwriter.
{% endhint %}

---

## Troubleshooting

**Problem**: "Run Python File" button doesn't appear
- **Solution**: Make sure you saved the file with `.py` extension and installed the Python extension

**Problem**: "Python is not recognized" or "No Python interpreter found"
- **Solution**: Reinstall Python and make sure to check "Add Python to PATH" during installation (Windows), or verify installation with `python3 --version` in terminal (Linux)

**Problem**: Terminal shows an error about execution policy (Windows)
- **Solution**: Open PowerShell as Administrator and run:
```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Problem**: Wrong Python version selected
- **Solution**: Click on the Python version in the bottom-right corner of VSCode and select a different interpreter from the list

---

{% hint style="success" %}
**Environment Ready?**
[Complete the Python Onramp →](https://www.google.com/search?q=../python-onramp/)
{% endhint %}
