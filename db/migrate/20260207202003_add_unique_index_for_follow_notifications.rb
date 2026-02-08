class AddUniqueIndexForFollowNotifications < ActiveRecord::Migration[8.1]
  UNIQUE_INDEX_NAME = "index_notifications_unique_follow"
  UNIQUE_INDEX_WHERE = "action = 'follow' AND notifiable_type IS NULL AND notifiable_id IS NULL"

  def up
    execute <<~SQL.squish
      DELETE FROM notifications n
      USING notifications newer
      WHERE n.action = 'follow'
        AND n.notifiable_type IS NULL
        AND n.notifiable_id IS NULL
        AND newer.action = 'follow'
        AND newer.notifiable_type IS NULL
        AND newer.notifiable_id IS NULL
        AND n.recipient_id = newer.recipient_id
        AND n.actor_id = newer.actor_id
        AND (
          n.updated_at < newer.updated_at OR
          (n.updated_at = newer.updated_at AND n.id < newer.id)
        )
    SQL

    add_index :notifications,
              [:recipient_id, :actor_id, :action],
              unique: true,
              where: UNIQUE_INDEX_WHERE,
              name: UNIQUE_INDEX_NAME
  end

  def down
    remove_index :notifications, name: UNIQUE_INDEX_NAME
  end
end
