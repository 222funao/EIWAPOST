class CreateNotifications < ActiveRecord::Migration[8.1]
  def change
    create_table :notifications do |t|
      t.bigint :recipient_id, null: false
      t.bigint :actor_id
      t.string :action, null: false
      t.string :notifiable_type
      t.bigint :notifiable_id
      t.integer :group_count, null: false, default: 1
      t.datetime :read_at
      t.jsonb :data, null: false, default: {}
      t.timestamps
    end

    add_index :notifications, :recipient_id
    add_index :notifications, :actor_id
    add_index :notifications, [:notifiable_type, :notifiable_id]
    add_index :notifications, [:recipient_id, :action, :notifiable_type, :notifiable_id], name: "index_notifications_grouping"

    add_foreign_key :notifications, :users, column: :recipient_id
    add_foreign_key :notifications, :users, column: :actor_id
  end
end
