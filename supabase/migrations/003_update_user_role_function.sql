-- Create a function to update user roles
CREATE OR REPLACE FUNCTION update_user_role(user_id UUID, new_role TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET role = new_role::user_role, updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

