class AddAllowMemberEditToGroups < ActiveRecord::Migration[8.1]
  def change
    add_column :groups, :allow_member_edit, :boolean, null: false, default: false
  end
end
