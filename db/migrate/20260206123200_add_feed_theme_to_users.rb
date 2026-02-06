class AddFeedThemeToUsers < ActiveRecord::Migration[8.1]
  def change
    return if column_exists?(:users, :feed_theme)

    add_column :users, :feed_theme, :string, null: false, default: "obsidian"
  end
end
