# 🔐 GymFuel — Secrets & Environment Variables Guide

> This document explains every secret used by GymFuel, how to generate them, and where to put them.

---

## Local Development

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

> [!CAUTION]
> Never commit `.env` to git. It's in `.gitignore`. Only `.env.example` should be committed.

---

## Required Secrets (Server Won't Start Without These)

| Variable                | Description                          | How to Get                                                                                              |
| ----------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `MONGO_URI`             | MongoDB connection string            | Use `mongodb://localhost:27017/gymfuel` locally, or get from [MongoDB Atlas](https://cloud.mongodb.com) |
| `JWT_SECRET`            | Signs user JWT tokens                | Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`                    |
| `FIREBASE_PROJECT_ID`   | Firebase project identifier          | [Firebase Console](https://console.firebase.google.com) → Project Settings                              |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email       | Firebase Console → Project Settings → Service Accounts → Generate New Private Key                       |
| `FIREBASE_PRIVATE_KEY`  | Firebase service account private key | Same as above (the JSON file contains this)                                                             |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud identifier          | [cloudinary.com](https://cloudinary.com) → Dashboard                                                    |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                   | Cloudinary → Dashboard → API Keys                                                                       |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                | Cloudinary → Dashboard → API Keys                                                                       |
| `GEMINI_API_KEY`        | Google Gemini AI API key             | [aistudio.google.com](https://aistudio.google.com) → Get API Key                                        |
| `VAPID_PUBLIC_KEY`      | Web Push public key                  | Run: `npx web-push generate-vapid-keys`                                                                 |
| `VAPID_PRIVATE_KEY`     | Web Push private key                 | Same command as above                                                                                   |
| `VAPID_EMAIL`           | Contact email for push service       | Use `mailto:admin@gymfuel.com` format                                                                   |

---

## Optional Secrets

| Variable              | Description           | How to Get                                                               |
| --------------------- | --------------------- | ------------------------------------------------------------------------ |
| `USDA_API_KEY`        | USDA FoodData API key | [api.nal.usda.gov](https://fdc.nal.usda.gov/api-guide.html) → Sign Up    |
| `NUTRITIONIX_APP_ID`  | Nutritionix App ID    | [nutritionix.com/business/api](https://www.nutritionix.com/business/api) |
| `NUTRITIONIX_APP_KEY` | Nutritionix App Key   | Same as above                                                            |
| `SMTP_HOST`           | Email server hostname | Use `smtp.gmail.com` for Gmail                                           |
| `SMTP_USER`           | Email username        | Your Gmail address                                                       |
| `SMTP_PASS`           | Email app password    | Gmail → Security → App Passwords                                         |

---

## GitHub Actions Secrets (for CI/CD)

Go to: **GitHub Repo → Settings → Secrets and variables → Actions → New repository secret**

### Required for Staging Deployment (`#I-04`)

| Secret Name   | Value                                              | Used In              |
| ------------- | -------------------------------------------------- | -------------------- |
| `VPS_HOST`    | Your CloudClusters VPS IP address                  | `deploy-staging.yml` |
| `VPS_USER`    | SSH username (e.g. `deploy`)                       | `deploy-staging.yml` |
| `VPS_SSH_KEY` | Private SSH key (contents of `~/.ssh/id_rsa`)      | `deploy-staging.yml` |
| `GHCR_TOKEN`  | GitHub Personal Access Token with `write:packages` | `deploy-staging.yml` |

### Required for Backend (passed to Docker containers)

| Secret Name             | Maps to `.env` Variable |
| ----------------------- | ----------------------- |
| `MONGO_URI`             | `MONGO_URI`             |
| `REDIS_URI`             | `REDIS_URI`             |
| `JWT_SECRET`            | `JWT_SECRET`            |
| `ADMIN_JWT_SECRET`      | `ADMIN_JWT_SECRET`      |
| `FIREBASE_PROJECT_ID`   | `FIREBASE_PROJECT_ID`   |
| `FIREBASE_CLIENT_EMAIL` | `FIREBASE_CLIENT_EMAIL` |
| `FIREBASE_PRIVATE_KEY`  | `FIREBASE_PRIVATE_KEY`  |
| `CLOUDINARY_CLOUD_NAME` | `CLOUDINARY_CLOUD_NAME` |
| `CLOUDINARY_API_KEY`    | `CLOUDINARY_API_KEY`    |
| `CLOUDINARY_API_SECRET` | `CLOUDINARY_API_SECRET` |
| `GEMINI_API_KEY`        | `GEMINI_API_KEY`        |
| `VAPID_PUBLIC_KEY`      | `VAPID_PUBLIC_KEY`      |
| `VAPID_PRIVATE_KEY`     | `VAPID_PRIVATE_KEY`     |
| `VAPID_EMAIL`           | `VAPID_EMAIL`           |

---

## Generating Secrets — Quick Reference

```bash
# JWT Secret (64 bytes → 128 hex chars)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# VAPID Keys (for Web Push notifications)
npx web-push generate-vapid-keys

# Admin JWT Secret (use same command as JWT_SECRET)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Firebase Private Key — Common Gotcha

When you download the Firebase service account JSON, the `private_key` field contains literal `\n` characters. When copying to `.env`, keep it on one line with the literal `\n` characters:

```bash
# ✅ Correct in .env:
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBAD...\n-----END PRIVATE KEY-----\n"

# ❌ Wrong (will cause authentication failures):
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
```

In `server/src/config/env.ts`, the private key is automatically processed:

```ts
FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
```

---

## Staging vs Production

| Environment | Where to Set                                                       |
| ----------- | ------------------------------------------------------------------ |
| Local Dev   | `.env` file                                                        |
| Staging     | GitHub Secrets → passed to Docker via `docker-compose.staging.yml` |
| Production  | Same as staging — update GitHub Secrets with production values     |
