# IDE Setup Guide

Before we dive into Python and algorithms, you need to set up your development environment. We're giving you **two excellent options** - choose the one that fits your workflow best!

## Option 1: PyCharm (Recommended for Python-Only Work)

**Best for**: Students who want a powerful, Python-focused environment with excellent debugging tools.

### Why PyCharm?
- Purpose-built for Python development
- Excellent debugging and testing tools
- Free for students with your university email!


---

## Option 2: VSCode (Recommended - Our Preferred Choice)

**Best for**: Students who want a versatile, customizable editor that will serve them beyond this course.

### Why VSCode?
- Extremely versatile and customizable
- Works for multiple programming languages
- GitHub Copilot integration available
- Lightweight but powerful

### A Word About AI Assistants (Like Copilot)

**Important Philosophy**: Tools like GitHub Copilot are incredible productivity boosters, but over-reliance can bite you down the road. 

**For this module**: Since REII 211 focuses on understanding **algorithms** rather than complex coding syntax, feel free to use Copilot for boilerplate code. What matters is that you understand:
- How the algorithm works
- Why it's efficient (or not)
- When to apply it

The complex syntax? That's a future-you problem. Your job now is to understand computational thinking.

### Setup Instructions

#### Step 1: Download and Install VSCode

**Windows Users**:
- Open the Microsoft Store
- Search for "Visual Studio Code"
- Click "Install"

**Linux Users**:

*Fedora/RHEL:*
```bash
sudo dnf install code
```

*Ubuntu/Debian:*
```bash
sudo apt install code
```

*Or download directly from*: [https://code.visualstudio.com/](https://code.visualstudio.com/)

---

#### Step 2: Install Python

**Windows Users**:
- Open the Microsoft Store
- Search for "Python 3.12" (or latest version)
- Click "Install"

**Linux Users**:
Python is usually pre-installed. Verify by opening a terminal and typing:
```bash
python3 --version
```

If not installed:
```bash
# Fedora/RHEL
sudo dnf install python3

# Ubuntu/Debian
sudo apt install python3
```

---

#### Step 3: Install Essential VSCode Extensions

1. Open VSCode
2. Click the **Extensions** icon on the left sidebar (or press `Ctrl+Shift+X`)
3. Search for and install the following:

**Required**:
- **Python** (by Microsoft) - Provides Python language support
  - Click "Install"
  - This will also prompt you to install Pylance (accept it)

**Highly Recommended**:
- **Jupyter** (by Microsoft) - For working with notebooks in the Python onramp
- **Python Debugger** (by Microsoft) - Enhanced debugging capabilities

---

#### Step 4: Create Your First Python File

1. **Create a new file**: Press `Ctrl+N` (or `Cmd+N` on Mac)

2. **Paste this code**:
```python
print("Hello world!\n")
print("Name: YOUR_NAME_HERE")
print("Student Number: YOUR_STUDENT_NUMBER_HERE")
```

3. **Replace the placeholder text**:
   - Change `YOUR_NAME_HERE` to your actual name
   - Change `YOUR_STUDENT_NUMBER_HERE` to your student number


4. **Save the file**: Press `Ctrl+S` (or `Cmd+S` on Mac)
   - A dialog will appear asking where to save
   - Choose a location
   - **Important**: Name your file with the `.py` extension, for example: `hello_world.py`
   - VSCode should automatically detect it as a Python file (you'll see the Python icon next to the filename)

---

#### Step 5: Run Your Python File

1. **Locate the Run button**: Look at the **top-right corner** of VSCode - you should see a **play button** with text that says "Run Python File"

2. **Click the Run button**

3. **Select Python Interpreter** (if prompted):
   - A dropdown may appear asking you to select a Python interpreter
   - Choose the **latest version** you installed (e.g., Python 3.12.x)
   - If you installed via Windows Store, it might be labeled as "Microsoft Store Python"
   - If you installed via Linux package manager, it will show the system path (e.g., `/usr/bin/python3`)

4. **Check the output**: The **Terminal panel** at the bottom of VSCode should appear and show:
```
   Hello world!

   Name: John Doe
   Student Number: 12345678
```

---

## Verification: Hello World Assignment

### Submission Requirements

**What to submit**: A screenshot or text copy of your terminal output showing:
1. The "Hello world!" message
2. Your name
3. Your student number


### How to Submit

1. **Take a screenshot** of the terminal output, OR
2. **Submission Method**: Submit via efundi when assignment opens.

---

### Troubleshooting

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

**Next**: Complete the [Python Onramp](../python-onramp/) →
