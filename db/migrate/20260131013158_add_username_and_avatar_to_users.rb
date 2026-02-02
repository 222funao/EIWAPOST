class AddUsernameAndAvatarToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :username, :string, null: false
    add_column :users, :avatar, :string

    add_index :users, :username, unique: true
    # add_index :users, :email, unique: true  # <- QUITAR (ya existe por Devise)
  end
end
