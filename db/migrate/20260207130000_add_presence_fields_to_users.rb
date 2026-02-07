class AddPresenceFieldsToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :last_seen_at, :datetime
    add_column :users, :invisible, :boolean, default: false, null: false
    add_index :users, :last_seen_at
  end
end
