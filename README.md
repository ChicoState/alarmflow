# AlarmFlow

### 1. Requirements

- Docker Desktop (WSL 2 enabled on Windows)
- Expo Go app on mobile

### 2. Quick Start

**VS Code Users:**

- Open folder -> `F1` -> `Dev Containers: Reopen in Container`. (Or you could just pay attention to the bottom right curner notificaion of the VS Code prompting to Reopen in Container)

**Terminal Users:**

- Run `docker-compose up --build`. (If you are using VS Code you do not need to run it _(Also I didn't check if it works)_)

### 3. Dependencies

**Do not run** `npm install` on your host machine. Use the container terminal or scripts:

- **Windows:** `.\scripts\dnpm.ps1 install <package>`
- **Linux/macOS:** `./scripts/dnpm.sh install <package>`

### 4. Git Workflow

- **Update:** `git pull`
- **Submit:** `git push`

### 5. Troubleshooting

- **Run on Mobile:** `npx expo start --tunnel` then scan QR Code and in the console login or chose option to enter as in anonymous mode
- **Connection issues:** Press `r` in terminal to reload tunnel.
- **Permission errors:** Run `chmod +x scripts/dnpm.sh` (Linux/Mac). I didn't tested if that works ... hopfuly it does ^^ ... however if you are using VS Code IDE you should not be using this commands anyways.
