# frc-inventory-app

This inventory app was designed by Green River College students Augy Markham and Rebecca Riffle  to help First Robotics Competition teams track and manage inventory.

**Contents**
1. [Quick Start](#quick-start)
1. [User Guide](#user-guide)
1. [Developer Notes](#developer-notes)

## Quick Start
### Fork and Clone repo
Prerequisite: Free GitHub account, code editor such as VS Code

1. Go to the repository: https://github.com/augleBoBaugles/frc-inventory-app  
2. Click the **Fork** button in the top-right corner to create your own copy of the repo  
3. In your forked repo, click the green **Code** button and copy the HTTPS URL  
4. Open a terminal and run:

```
git clone <your-forked-repo-url>
cd frc-inventory-app
```

### Install Dependencies
```
cd server
npm i
```
### Initiialize Inventory Database
`npm run init-db`
## User Guide
**Contents**

1.[Troubleshooting](#troubleshooting)
### Troubleshooting
#### Reset Database
*Warning: This will delete ALL the contents of your database. Proceed with caution!*

`npm run reset-db`
## Developer Notes
### DB Schema
```mermaid
erDiagram
    TOOLS 
    TOOLS {
        string name
        string status
    }
```