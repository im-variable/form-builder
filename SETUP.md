# Setup Guide

## Python Version Management with pyenv

This project uses **pyenv** for Python version management. pyenv allows you to easily switch between Python versions and ensures all developers use the same version.

### Installing pyenv

#### macOS
```bash
brew install pyenv
```

Add to your `~/.zshrc` or `~/.bash_profile`:
```bash
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
```

#### Linux
```bash
curl https://pyenv.run | bash
```

Add to your `~/.bashrc`:
```bash
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
```

### Setting Up This Project

1. **Install the required Python version:**
   ```bash
   pyenv install 3.11.0
   ```

2. **Set the local Python version:**
   ```bash
   pyenv local 3.11.0
   ```
   
   This creates a `.python-version` file that pyenv will use automatically.

3. **Verify Python version:**
   ```bash
   python --version
   # Should output: Python 3.11.0
   ```

4. **Install project dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

### Benefits of pyenv

- ✅ Consistent Python versions across team members
- ✅ Easy switching between Python versions
- ✅ No need for virtual environments (though you can still use them)
- ✅ Automatic version detection via `.python-version` file

### Alternative: Using Virtual Environment

If you prefer using a virtual environment instead:

```bash
# Create virtual environment
python -m venv .venv

# Activate it
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Verifying Setup

Run the verification script:
```bash
python verify_setup.py
```

This will check:
- ✓ All imports are working
- ✓ Database connection
- ✓ API routes are registered

## Next Steps

- Read [QUICKSTART.md](QUICKSTART.md) for quick usage examples
- Check [README.md](README.md) for full API documentation
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) if you encounter issues


