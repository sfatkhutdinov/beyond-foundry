# NEXT STEPS for Beyond Foundry Maintainers

## 1. Main Branch Protection and Large File Removal

- The main branch is protected on GitHub and does not allow force-pushes.
- If you need to remove a large file from git history (e.g., >100MB), you must:
  1. Temporarily disable branch protection for `main` in the GitHub repository settings.
  2. Force-push the cleaned history (`git push --force`).
  3. Re-enable branch protection immediately after.
- Alternatively, contact GitHub support for help removing large files from history if you cannot disable protection.

## 2. .gitignore and Large Files

- Ensure `.gitignore` excludes all large files, especially:
  - Archives (e.g., `*.zip`, `*.tar.gz`)
  - Binary data, cache, and container files
  - FoundryVTT installation zips and cache
- Example additions:
  ```
  *.zip
  *.tar.gz
  data/container_cache/
  data/Logs/
  build/
  *.bin
  *.exe
  *.dmg
  *.iso
  *.img
  *.7z
  *.rar
  *.lfs
  ```

### Option A: Development Symlink (Recommended)
```bash
# Link entire project for live development
# Replace /path/to/your/foundrydata with your actual Foundry Data path
ln -s "$(pwd)" \
      "/path/to/your/foundrydata/Data/modules/beyond-foundry"
```

### Option B: Copy Development Package
```bash
# Copy built files only
# Replace /path/to/your/foundrydata with your actual Foundry Data path
cp -r "$(pwd)/foundry-dev-package" \
      "/path/to/your/foundrydata/Data/modules/beyond-foundry"
```

## 3. Git LFS (Large File Storage)

- For any large assets that must be versioned, use [Git LFS](https://git-lfs.github.com/).
- Install with `brew install git-lfs` (macOS) or see the Git LFS docs.
- Track files with `git lfs track '*.zip'` and commit the `.gitattributes` file.

## 4. Documentation and Canonical Status

- This repository is now the main and canonical source for Beyond Foundry.
- All development, issues, and releases should be tracked here.
- Keep this file updated with any future repository maintenance steps.

## 5. Contact

- For help with repository maintenance, contact the current lead maintainer or open an issue on GitHub.
