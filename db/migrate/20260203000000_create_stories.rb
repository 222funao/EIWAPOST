class CreateStories < ActiveRecord::Migration[7.1]
  def change
    create_table :stories do |t|
      t.references :user, null: false, foreign_key: true
      t.datetime :expires_at, null: false

      t.timestamps
    end

    add_index :stories, :expires_at
  end
end
