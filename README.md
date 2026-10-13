# Fortitude Club website

The full fortitudeclub.ca site: public pages, member sign-up with manual work-email verification,
a digital membership card, offer browsing, tracked redemptions, and an admin area.

Built with Next.js 14, Supabase (accounts and database) and Vercel (hosting).

## What's in it

| Page | Who sees it | What it does |
|---|---|---|
| `/` | Everyone | Home page |
| `/offers`, `/offers/[id]` | Everyone | Browse and filter live offers. Approved members can tap **Redeem offer** |
| `/partners`, `/employers`, `/contact` | Everyone | Public info pages |
| `/signup` | Everyone | Name, work email, employer, password. New accounts start as **pending** |
| `/login`, `/forgot-password`, `/reset-password` | Everyone | Sign in and password reset |
| `/card` | Signed-in members | Live membership card (approved), or verification status (pending) plus redemption history |
| `/admin` | Admins | Review queue: approve, reject or revoke members; fix employer; make other admins |
| `/admin/redemptions` | Admins | Redemption counts by offer and employer, latest 100, CSV download of everything |
| `/admin/offers` | Admins | Create, edit, hide or publish offers and partners |
| `/admin/employers` | Admins | Employers shown at sign-up, with email domains for automatic match flags |

**Redeeming:** each offer is set to one of three methods. *Show card* records the redemption and tells the member to show their card. *Promo code* records it and reveals the code. *Booking link* records it and sends the member to the partner's booking page. Every tap is saved with member, employer, offer and time.

**Security:** the database enforces the rules itself (row level security). Members can only see their own profile and redemptions, can't approve themselves, and can't redeem until approved. Only admins can change members, offers or partners.

---

## Setup (about 30 minutes)

### 1. Supabase (database and accounts)

1. Go to supabase.com and create a new project. Choose the **Canada (Central)** region.
2. Open **SQL Editor → New query**, paste the whole of `supabase/schema.sql`, and click **Run**.
   This creates the tables, the security rules, your two employers (SALT and JAM) and your three partners with draft offers.
3. Open **Authentication → URL Configuration**:
   - Site URL: `https://fortitudeclub.ca`
   - Redirect URLs: add `https://fortitudeclub.ca/**` and `http://localhost:3000/**`
4. Open **Authentication → Emails → SMTP Settings** and connect a real email sender (for example Resend or Postmark).
   Supabase's built-in email is meant for testing and only sends a small number of emails per hour, which is not enough for launch.
5. Open **Project Settings → API** and copy the **Project URL** and the **anon public** key. You'll need them in step 2.

### 2. Vercel (hosting)

1. Put this folder in a GitHub repository (GitHub Desktop is the easiest way: *Add existing repository → Publish*).
2. In Vercel, click **Add New → Project** and import the repository.
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = the Project URL from Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the anon public key
   - `NEXT_PUBLIC_SITE_URL` = `https://fortitudeclub.ca`
4. Click **Deploy**. You'll get a test address like `fortitude-club.vercel.app`.
   While testing on that address, add `https://fortitude-club.vercel.app/**` to Supabase's Redirect URLs too.

### 3. Make yourself the first admin

1. On the live site, sign up with your own email and confirm it from the email you receive.
2. In Supabase **SQL Editor**, run (with your email):
   ```sql
   update public.profiles set role = 'admin', status = 'approved' where work_email = 'you@fortitudeclub.ca';
   ```
3. Sign in again. You'll see **Admin** in the menu. From there you can make other team members admins.

### 4. Add your real offers

In **Admin → Offers and partners**, open each draft offer, fill in the real details, choose how members redeem it,
tick **Live on the site** and save. Drafts stay hidden until you do this.

### 5. Move fortitudeclub.ca from Squarespace

1. In Vercel: **Project → Settings → Domains**, add `fortitudeclub.ca` and `www.fortitudeclub.ca`.
2. Vercel shows the DNS records to set. Add them wherever the domain is managed (if it was bought through
   Squarespace, that's **Squarespace → Domains → DNS settings**) and remove the old Squarespace website records.
3. Once the new site loads on fortitudeclub.ca, you can cancel the Squarespace website plan. Keep the domain registration.

---

## Running it on your computer (optional)

```bash
npm install
cp .env.example .env.local   # then fill in the three values
npm run dev                  # open http://localhost:3000
```

## Good to know

- **Email links open in the same browser.** Confirmation and password-reset links must be opened on the same device and browser where the person signed up or requested the reset. Otherwise they're asked to sign in or request a new link.
- **Approval emails aren't sent automatically.** Approved members see their card the next time they open `/card`. If you want an automatic "You're approved" email, that can be added with your email provider.
- **Employer list.** People choose their employer at sign-up from the employers marked *Shown at sign-up*. Add an email domain to each employer so the review queue flags matching and non-matching work emails.
- **Photos.** Partner photos are added as image links in the partner editor and appear on offer tiles.
