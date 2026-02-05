class CreateStoryLikes < ActiveRecord::Migration[8.1]
  def change
    create_table :story_likes do |t|
      t.references :user, null: false, foreign_key: true
      t.references :story, null: false, foreign_key: true

      t.timestamps
    end

    add_index :story_likes, [:user_id, :story_id], unique: true
  end
end
