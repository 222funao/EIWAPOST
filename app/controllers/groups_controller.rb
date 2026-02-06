class GroupsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_group, only: [:update]

  def create
    @group = Group.new(group_params.merge(created_by: current_user))
    member_ids = selected_member_ids

    if member_ids.empty?
      return redirect_to messages_path, alert: "Selecciona al menos un amigo para el grupo"
    end

    if @group.save
      @group.group_memberships.create!(user: current_user, role: :leader)
      member_ids.each do |member_id|
        @group.group_memberships.create!(user_id: member_id)
      end
      redirect_to messages_path(group_id: @group.id)
    else
      redirect_to messages_path, alert: @group.errors.full_messages.first
    end
  end

  def update
    if can_update_group?
      if @group.update(group_params)
        redirect_to messages_path(group_id: @group.id)
      else
        redirect_to messages_path(group_id: @group.id), alert: @group.errors.full_messages.first
      end
    else
      head :forbidden
    end
  end

  private

  def group_params
    params.require(:group).permit(:name, :avatar, :allow_member_edit)
  end

  def selected_member_ids
    member_ids = Array(params.dig(:group, :member_ids)).reject(&:blank?).map(&:to_i)
    friend_ids = current_user.friend_ids
    member_ids & friend_ids
  end

  def set_group
    @group = current_user.groups.find(params[:id])
  end

  def can_update_group?
    return true if @group.leader?(current_user)

    @group.allow_member_edit? && member_edit_only?
  end

  def member_edit_only?
    params[:group].present? &&
      params[:group].keys.all? { |key| %w[name avatar].include?(key.to_s) }
  end
end
