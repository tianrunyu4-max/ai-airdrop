#!/usr/bin/env node
// Usage: node scripts/create_genesis_user.mjs <username> <password> [inviteCode]

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || process.env.VITE_SUPABASE_SERVICE_ROLE

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing env: SUPABASE_URL or SUPABASE_SERVICE_ROLE')
  process.exit(1)
}

const [,, usernameArg, passwordArg, inviteArg] = process.argv
if (!usernameArg || !passwordArg) {
  console.error('Usage: node scripts/create_genesis_user.mjs <username> <password> [inviteCode]')
  process.exit(1)
}

const username = usernameArg
const password = passwordArg

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
  return code
}

const inviteCode = (inviteArg || generateInviteCode()).toUpperCase()

const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

async function main() {
  // Check if any user exists in public.users
  const { count, error: countErr } = await admin
    .from('users')
    .select('*', { count: 'exact', head: true })
  if (countErr) {
    console.error('Count error:', countErr)
    process.exit(1)
  }
  if (count && count > 0) {
    console.error('Users already exist, aborting genesis creation.')
    process.exit(1)
  }

  // Create auth user (confirmed)
  const email = `${username}@airdrop.app`
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username }
  })
  if (createErr) {
    console.error('Create auth user error:', createErr)
    process.exit(1)
  }
  const userId = created.user.id

  // Insert profile row
  const { error: insertErr } = await admin.from('users').insert({
    id: userId,
    username,
    invite_code: inviteCode,
    inviter_id: null,
    is_agent: false,
    is_admin: true,
    u_balance: 0,
    points_balance: 0
  })
  if (insertErr) {
    console.error('Insert profile error:', insertErr)
    process.exit(1)
  }

  console.log('\n✅ Genesis user created!')
  console.log('Email:', email)
  console.log('Password:', password)
  console.log('Invite Code:', inviteCode)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})







































