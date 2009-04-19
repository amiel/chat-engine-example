# Be sure to restart your server when you modify this file.

# Your secret key for verifying cookie session data integrity.
# If you change this key, all old sessions will become invalid!
# Make sure the secret is at least 30 characters and all random, 
# no regular words or you'll be exposed to dictionary attacks.
ActionController::Base.session = {
  :key         => '_chattest_session',
  :secret      => 'c5d9cfd1c01173c878a36b498df40518d890b7d4bdfcd73c2529d034f3169cb7a23bbd534e43e0ab47fb0363f39a8e0e5c10621e92bf8939f07c83ad2f7c3bf5'
}

# Use the database for sessions instead of the cookie-based default,
# which shouldn't be used to store highly confidential information
# (create the session table with "rake db:sessions:create")
# ActionController::Base.session_store = :active_record_store
