# FormRise Deployment Checklist
Work through this top to bottom. Check each box as you complete it.
Come back to Claude anytime you get stuck — just say which step you're on.

---

## PART 1 — Buy a Domain

- [ ] Go to **porkbun.com** and create an account
- [x] Domain already purchased: **formrise.fyi** ✅
- [x] Write your domain here: `formrise.fyi`

---

## PART 2 — Set Up Cloudflare (Free DNS + SSL)

- [ ] Go to **
** and create a free account
- [ ] Click **Add a Site** → type your domain → choose **Free plan**
- [ ] Cloudflare scans your DNS — click **Continue**
- [ ] Cloudflare gives you 2 nameservers, e.g.:
  ```
  aria.ns.cloudflare.com
  bob.ns.cloudflare.com
  ```
- [ ] Go back to **Porkbun** → your domain → **Nameservers** → switch to custom → paste the 2 Cloudflare nameservers
- [ ] Back in Cloudflare → click **Done, check nameservers**
- [ ] Wait 5–30 minutes for DNS to propagate (you can continue to next parts while waiting)

---

## PART 3 — Push Code to GitHub

- [ ] Go to **github.com** → sign in or create account
- [ ] Click **New repository** → name it `form-builder` → set to **Private** → click **Create repository**
- [ ] Open Terminal on your Mac and run these commands one by one:
  ```bash
  cd /Users/apple/Desktop/applications/form-builder
  git init
  git add -A
  git commit -m "Initial commit"
  git remote add origin https://github.com/YOUR_USERNAME/form-builder.git
  git push -u origin main
  ```
  > Replace `YOUR_USERNAME` with your actual GitHub username
- [ ] If GitHub asks for a password, use a **Personal Access Token** instead:
  - GitHub → Settings (top right avatar) → Developer Settings → Personal access tokens → Tokens (classic) → Generate new token
  - Check the `repo` box → Generate → copy the token → use it as your password
- [ ] Verify: go to `github.com/YOUR_USERNAME/form-builder` and see your files there

---

## PART 4 — Create the Hetzner Server

- [ ] Go to **hetzner.com** → click **Cloud** → sign up (needs credit card or PayPal)
- [ ] Click **New Project** → name it `formrise` → click **Add Server**
- [ ] Choose settings:
  - **Location**: pick closest to you or your users
  - **Image**: Ubuntu **24.04**
  - **Type**: Shared CPU → **CX22** (2 vCPU, 4GB RAM — €4.35/month)
  - **SSH Keys**: click **Add SSH Key** (follow the next step first)
- [ ] Create your SSH key — open a **new Terminal tab** on your Mac and run:
  ```bash
  ssh-keygen -t ed25519 -C "formrise-server"
  # Press Enter for every question (just hit Enter 3 times)
  ```
- [ ] Copy your public key:
  ```bash
  cat ~/.ssh/id_ed25519.pub
  ```
  Select and copy the entire output line
- [ ] Paste that key into Hetzner's SSH Key field → give it a name → **Add SSH Key**
- [ ] Back on the Add Server page → select your SSH key → click **Create & Buy**
- [ ] Wait ~30 seconds → copy the **server IP address** shown
- [ ] Write your server IP here: `_______________________`

---

## PART 5 — Point Your Domain to the Server

- [ ] Go to **Cloudflare** → your domain → **DNS** → **Add record**
- [ ] Add first record:
  - Type: `A`
  - Name: `@`
  - IPv4 address: your server IP
  - Proxy status: **OFF** (click the orange cloud to make it grey)
  - Click **Save**
- [ ] Add second record:
  - Type: `A`
  - Name: `www`
  - IPv4 address: your server IP (same)
  - Proxy status: **OFF** (grey)
  - Click **Save**
- [ ] Verify both records show as grey cloud (not orange)

---

## PART 6 — SSH Into the Server

- [ ] Open Terminal on your Mac and run:
  ```bash
  ssh root@YOUR_SERVER_IP
  # Replace YOUR_SERVER_IP with the IP from Part 4
  ```
- [ ] When it asks "Are you sure you want to continue connecting?" → type `yes` → press Enter
- [ ] You should see a prompt like `root@ubuntu-4gb-xxx:~#` — you're in!

> Everything from here runs ON THE SERVER (in this terminal window)

---

## PART 7 — Install Docker on the Server

Run these commands on the server one by one:

- [ ] Update the system:
  ```bash
  apt update && apt upgrade -y
  ```
  > This may take 1–2 minutes

- [ ] Install Docker:
  ```bash
  curl -fsSL https://get.docker.com | sh
  ```
  > This takes 1–2 minutes

- [ ] Verify Docker is working:
  ```bash
  docker --version
  docker compose version
  ```
  Both should print version numbers — if they do, Docker is ready ✅

---

## PART 8 — Get Your Code on the Server

- [ ] Install git:
  ```bash
  apt install git -y
  ```
- [ ] Clone your repository:
  ```bash
  git clone https://github.com/YOUR_USERNAME/form-builder.git /app
  ```
  > Replace YOUR_USERNAME with your GitHub username
  > If repo is private, it will ask for your GitHub username + personal access token (same token from Part 3)

- [ ] Go into the app folder:
  ```bash
  cd /app
  ```
- [ ] Verify the files are there:
  ```bash
  ls
  ```
  You should see: `backend  frontend  docker-compose.prod.yml  Caddyfile  .env.example` etc.

---

## PART 9 — Create Your Secret Config File

- [ ] Copy the example file:
  ```bash
  cp .env.example .env
  ```

- [ ] Generate a JWT secret (run this, copy the output):
  ```bash
  openssl rand -base64 48
  ```
  Write down or copy the output — you'll paste it in the next step

- [ ] Open the config file to edit:
  ```bash
  nano .env
  ```

- [ ] Fill in each value in the file:
  - `DOMAIN` → your actual domain: `formrise.fyi` (no https://)
  - `DB_PASSWORD` → make up a strong password, e.g. `Kf9mP2xLqR8vNs3`
  - `JWT_SECRET` → paste the output from `openssl rand -base64 48` above
  - `GOOGLE_CLIENT_ID` → already filled in ✅
  - `BREVO_SMTP_USER` → your Brevo login email (do Part 10 first if needed)
  - `BREVO_SMTP_PASS` → your Brevo SMTP password

- [ ] Save and exit nano: press `Ctrl+O` → press **Enter** → press `Ctrl+X`

- [ ] Verify it saved correctly:
  ```bash
  cat .env
  ```
  Check all values are filled (no blank values)

---

## PART 10 — Set Up Brevo (Free Email for OTP)

Do this on your computer in a browser (open a new tab, keep server terminal open):

- [ ] Go to **brevo.com** → create a free account
- [ ] After login → go to **Transactional** → **Email** → **Settings** → **Senders & Domains**
- [ ] Click **Add a domain** → type `formrise.fyi` → click **Save**
- [ ] Brevo will show you DNS records to add (TXT records for SPF and DKIM)
- [ ] Go to **Cloudflare** → your domain → **DNS** → add each record Brevo shows you
- [ ] Back in Brevo → click **Verify** → it should say domain verified ✅
- [ ] Go to **SMTP & API** → **SMTP** tab
- [ ] Copy your **Login** (your email) → paste into `.env` as `BREVO_SMTP_USER`
- [ ] Click **Generate a new SMTP key** → copy it → paste into `.env` as `BREVO_SMTP_PASS`
- [ ] Update the `.env` file on the server with these values:
  ```bash
  nano /app/.env
  ```

---

## PART 11 — Update Google OAuth for Production

Do this on your computer in a browser:

- [ ] Go to **console.cloud.google.com** → select your project
- [ ] Go to **APIs & Services** → **Credentials**
- [ ] Click on your **OAuth 2.0 Client ID**
- [ ] Under **Authorized JavaScript origins** → click **Add URI**
  - Add: `https://formrise.fyi` (your real domain)
- [ ] Click **Save**

---

## PART 12 — Launch the App

Back on the server terminal:

- [ ] Make sure you're in the right folder:
  ```bash
  cd /app
  ```

- [ ] Build and start everything:
  ```bash
  docker compose -f docker-compose.prod.yml up -d --build
  ```
  > This takes **3–5 minutes** on first run — it's downloading images and building your app
  > You'll see lots of output — that's normal

- [ ] Watch the logs to see when it's ready:
  ```bash
  docker compose -f docker-compose.prod.yml logs -f
  ```
  > Wait until you see Caddy say something like `certificate obtained successfully` and no red errors
  > Press `Ctrl+C` to stop watching (services keep running)

- [ ] Check all services are running:
  ```bash
  docker compose -f docker-compose.prod.yml ps
  ```
  All rows should say `running` or `Up`

---

## PART 13 — Verify Everything Works

- [ ] Open your browser → go to `https://formrise.fyi`
  - You should see the FormRise login page ✅
  - There should be a padlock icon (SSL working) ✅

- [ ] Test the backend is alive:
  - Go to `https://formrise.fyi/api/forms`
  - You should see: `{"error":"Unauthorized"}` or similar — that's correct ✅

- [ ] Test the full flow:
  - [ ] Sign in with Google
  - [ ] Create a form
  - [ ] Add some fields
  - [ ] Publish the form
  - [ ] Open the public form link and fill it out
  - [ ] Check responses appear in the dashboard

- [ ] Test OTP email:
  - [ ] Sign out
  - [ ] Try signing in with a real email address
  - [ ] Check you receive the OTP email

---

## PART 14 — Done! Save These Commands

Pin these somewhere — you'll use them every time you update the app:

**Deploy an update (run on server):**
```bash
cd /app
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

**Check if everything is running:**
```bash
docker compose -f docker-compose.prod.yml ps
```

**View live logs:**
```bash
docker compose -f docker-compose.prod.yml logs -f
```

**View logs for one service only:**
```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f caddy
```

**Restart one service:**
```bash
docker compose -f docker-compose.prod.yml restart backend
```

**SSH into your server (from your Mac):**
```bash
ssh root@YOUR_SERVER_IP
```

---

## Cost Summary

| What | Cost |
|---|---|
| Hetzner CX22 server | €4.35/month (~$4.70) |
| Domain (Porkbun .com) | ~$9–10/year (~$0.80/month) |
| Cloudflare DNS | FREE |
| Brevo email | FREE (300 emails/day) |
| SSL certificate (Caddy) | FREE |
| **Total** | **~$5.50/month** |

---

## If Something Goes Wrong

**Server terminal is frozen / disconnected:**
```bash
ssh root@YOUR_SERVER_IP
cd /app
docker compose -f docker-compose.prod.yml ps
```

**A service crashed:**
```bash
docker compose -f docker-compose.prod.yml logs backend   # see what went wrong
docker compose -f docker-compose.prod.yml restart backend
```

**SSL certificate not working (no padlock):**
- Make sure DNS A records in Cloudflare are set to grey cloud (NOT orange)
- Wait 10 minutes and try again — Caddy retries automatically

**"Connection refused" on your domain:**
- DNS hasn't propagated yet — wait 10–15 minutes
- Check: `docker compose -f docker-compose.prod.yml ps` — all should be `Up`

**Forgot your server IP:**
- Go to hetzner.com → Cloud → your project → click the server

---

*Come back to Claude at any step and say "I'm on Step X of the deployment checklist" — I'll pick up right where you are.*
