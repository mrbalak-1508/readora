# READORA — VPS Hosting & Deployment Guide (SQLite + Prisma)

This platform is configured with **SQLite** and **Prisma ORM**. 
Because SQLite is a zero-configuration, self-contained serverless file database stored at `prisma/dev.db`, you do **not** need to install, configure, or pay for external database servers (like PostgreSQL, MySQL, or Supabase).

---

## 1. Prerequisites on Your VPS

On your VPS (Ubuntu 22.04 / 24.04, Debian, or similar Linux server), ensure you have:
* **Node.js**: v20+ or v22+
* **npm** or **pnpm**
* **PM2** (Process manager for Node.js)
* **Nginx** (Reverse proxy and SSL manager)

```bash
# Update and install Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git

# Install PM2 globally
sudo npm install -g pm2
```

---

## 2. Deploy READORA

### Step A: Clone the Repository
```bash
cd /var/www
git clone <your-repository-url> readora
cd readora
```

### Step B: Install Dependencies
```bash
npm install
```
*(The `postinstall` script automatically runs `prisma generate` to compile the Prisma Client for your VPS architecture).*

### Step C: Initialize & Seed SQLite Database
```bash
# Push Prisma schema to create prisma/dev.db
npm run db:push

# Seed the initial books, chapters, categories, and curator admin account
npm run db:seed
```

### Step D: Build the Next.js Production Bundle
```bash
npm run build
```

---

## 3. Run with PM2 (Background Daemon)

Start the application with PM2:

```bash
# Start Next.js on port 3000
pm2 start npm --name "readora" -- start

# Save PM2 process list so it restarts on system reboot
pm2 save
pm2 startup
```

Useful PM2 commands:
* View logs: `pm2 logs readora`
* Restart app: `pm2 restart readora`
* Monitor stats: `pm2 monit`

---

## 4. Configure Nginx Reverse Proxy & SSL

Create an Nginx configuration file for your domain:

```bash
sudo nano /etc/nginx/sites-available/readora
```

Paste the following configuration (replace `library.yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name library.yourdomain.com;

    # Client body size for book and cover uploads
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/readora /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Enable Free SSL with Let's Encrypt Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d library.yourdomain.com
```

---

## 5. Database Backups & Administration

### Backing Up the Database
Because READORA uses SQLite, your entire database is a single file located at:
`/var/www/readora/prisma/dev.db`

To create an instant backup:
```bash
# Simple one-line backup
cp /var/www/readora/prisma/dev.db /var/backups/readora-$(date +%F).db
```

### Prisma Studio (Visual Database GUI)
To view and edit database rows visually in your browser:
```bash
npx prisma studio --port 5555
```
*(You can tunnel port 5555 over SSH or access it locally).*

---

## 6. Default Admin Account

* **Email:** `curator@readora.library`
* **Role:** `admin` (Full rights to upload, edit, feature, unpublish books, and view analytics)
* You can also toggle roles on the fly using the **Admin / Reader** pill in the top navigation.
