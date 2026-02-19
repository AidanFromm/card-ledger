# eBay Integration Setup

This document explains how to set up the eBay API integration for CardLedger.

## Overview

The eBay integration allows users to:
1. **Connect their eBay account** via OAuth 2.0
2. **Import active listings** to their CardLedger inventory
3. **Sync sold items** to the sales tracker
4. **Look up prices** from eBay sold listings (public data)

## Architecture

### Frontend
- `src/lib/ebay.ts` - eBay API client with OAuth helpers and data mapping
- `src/pages/EbayConnect.tsx` - OAuth connection page
- `src/pages/EbayListings.tsx` - Import listings UI

### Backend (Supabase Edge Functions)
- `ebay-oauth-exchange` - Exchange OAuth code for tokens
- `ebay-connection-status` - Check connection status
- `ebay-disconnect` - Revoke/delete tokens
- `ebay-get-listings` - Fetch user's active listings (Sell API)
- `ebay-get-sold` - Fetch user's sold items (Fulfillment API)
- `ebay-sold-prices` - Search eBay for price lookup (Browse API)

### Database
- `ebay_connections` table - Stores OAuth tokens securely

## Setup Steps

### 1. eBay Developer Account

1. Go to https://developer.ebay.com/
2. Sign in or create a developer account
3. Create an application (Production keys)
4. Note your **App ID (Client ID)** and **Cert ID (Client Secret)**

### 2. Configure eBay App Settings

In the eBay Developer Console:

1. **OAuth Redirect URIs**: Add your redirect URI
   - Production: `https://cardledger.app/ebay/callback`
   - Development: `http://localhost:5173/ebay/callback`

2. **Required Scopes**: Ensure these are enabled:
   - `https://api.ebay.com/oauth/api_scope`
   - `https://api.ebay.com/oauth/api_scope/sell.inventory`
   - `https://api.ebay.com/oauth/api_scope/sell.inventory.readonly`
   - `https://api.ebay.com/oauth/api_scope/sell.fulfillment`
   - `https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly`
   - `https://api.ebay.com/oauth/api_scope/sell.account.readonly`

### 3. Environment Variables

#### Frontend (.env)
```env
VITE_EBAY_CLIENT_ID="your-client-id"
VITE_EBAY_REDIRECT_URI="https://cardledger.app/ebay/callback"
```

#### Supabase Secrets (Edge Functions)
Set these via the Supabase Dashboard or CLI:

```bash
supabase secrets set EBAY_CLIENT_ID="your-client-id"
supabase secrets set EBAY_CLIENT_SECRET="your-client-secret"
supabase secrets set EBAY_REDIRECT_URI="https://cardledger.app/ebay/callback"
```

### 4. Database Migration

Run the migration to create the `ebay_connections` table:

```bash
supabase db push
```

Or apply manually:
```sql
-- See: supabase/migrations/20260213_ebay_connections.sql
```

### 5. Deploy Edge Functions

```bash
supabase functions deploy ebay-oauth-exchange
supabase functions deploy ebay-connection-status
supabase functions deploy ebay-disconnect
supabase functions deploy ebay-get-listings
supabase functions deploy ebay-get-sold
```

## OAuth Flow

1. User clicks "Connect eBay Account" on `/ebay`
2. User is redirected to eBay login/authorization
3. After approval, eBay redirects to `/ebay/callback?code=...&state=...`
4. Frontend calls `ebay-oauth-exchange` edge function
5. Edge function exchanges code for tokens and stores in `ebay_connections`
6. User sees "Connected" status

## Token Management

- **Access tokens** expire in 2 hours
- **Refresh tokens** expire in 18 months
- Tokens are automatically refreshed in edge functions when needed
- Sensitive tokens are only accessible via service role

## Security Notes

- OAuth tokens are stored server-side only (Supabase)
- Client secret is never exposed to the browser
- State parameter prevents CSRF attacks
- Row-level security protects user data

## API Rate Limits

eBay APIs have rate limits:
- Browse API: ~5,000 calls/day
- Sell APIs: Varies by endpoint

The integration includes caching and error handling for rate limits.

## Troubleshooting

### "eBay authorization expired"
- User's refresh token has expired (after 18 months)
- User needs to reconnect their account

### "Failed to fetch listings"
- Check Supabase function logs
- Verify eBay credentials are correct
- Ensure required scopes are granted

### OAuth redirect fails
- Verify redirect URI matches exactly in eBay console
- Check EBAY_REDIRECT_URI secret is set correctly

## Future Enhancements

- [ ] Auto-sync sold items on schedule
- [ ] Cross-list to eBay from CardLedger
- [ ] Pull tracking numbers and shipping status
- [ ] eBay fees calculation
