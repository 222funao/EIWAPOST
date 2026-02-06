class AddFeedIconStyleToUsers < ActiveRecord::Migration[8.1]
  def change
    return if column_exists?(:users, :feed_icon_style)

    add_column :users, :feed_icon_style, :string, null: false, default: "outline"
  end
end
