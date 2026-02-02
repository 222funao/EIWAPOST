# db/migrate/xxxxxx_add_follow_counters_to_users.rb
class AddFollowCountersToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :followers_count, :integer, null: false, default: 0
    add_column :users, :following_count, :integer, null: false, default: 0
  end
end
