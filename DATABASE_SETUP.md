# Database Setup for CSS Battle Championship

## Players Table Migration

This document describes the database migration for creating the players table in Supabase.

### Migration File

The migration file is located at:
```
supabase/migrations/20251011000000_create_players_table.sql
```

### Table Structure

The players table contains the following fields:

1. `id` - UUID (Primary Key) - Auto-generated unique identifier
2. `full_name` - TEXT (Required) - Player's full name
3. `email` - TEXT (Required, Unique) - Player's email address
4. `cssbattle_profile_link` - TEXT (Optional) - Link to player's CSSBattle profile
5. `created_at` - TIMESTAMP WITH TIME ZONE - Record creation timestamp
6. `updated_at` - TIMESTAMP WITH TIME ZONE - Record last update timestamp

### Features

- Row Level Security (RLS) enabled for access control
- Automatic timestamp updates using a trigger function
- Proper indexing for performance
- Access policies for viewing and managing data

### Usage

To apply this migration to your Supabase instance, you would typically use the Supabase CLI:

```bash
supabase db push
```

Or through the Supabase dashboard migration interface.

### Form Integration

The registration form on the home page collects the following information:
- Full Name
- Email
- CSSBattle Profile Link (optional)

This data is structured to match the players table schema for easy insertion.