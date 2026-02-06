class CreateGroupsAndMemberships < ActiveRecord::Migration[8.1]
  def change
    create_table :groups do |t|
      t.string :name, null: false
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.timestamps
    end

    create_table :group_memberships do |t|
      t.references :group, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.integer :role, null: false, default: 0
      t.datetime :last_read_at
      t.timestamps
    end
    add_index :group_memberships, [:group_id, :user_id], unique: true

    add_reference :messages, :group, foreign_key: true
    change_column_null :messages, :conversation_id, true
  end
end
