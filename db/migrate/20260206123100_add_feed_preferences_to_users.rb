class AddFeedPreferencesToUsers < ActiveRecord::Migration[8.1]
  def change
    unless column_exists?(:users, :feed_posts_scope)
      add_column :users, :feed_posts_scope, :string, null: false, default: "all"
    end

    unless column_exists?(:users, :feed_include_own_posts)
      add_column :users, :feed_include_own_posts, :boolean, null: false, default: true
    end

    unless column_exists?(:users, :feed_stories_scope)
      add_column :users, :feed_stories_scope, :string, null: false, default: "all"
    end
  end
end
