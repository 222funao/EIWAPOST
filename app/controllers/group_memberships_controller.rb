class GroupMembershipsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_group
  before_action :ensure_leader, except: [:destroy]

  def create
    user = User.find_by(id: params.dig(:group_membership, :user_id))
    return redirect_to messages_path(group_id: @group.id), alert: "Usuario no encontrado" unless user

    unless current_user.friends_with?(user)
      return redirect_to messages_path(group_id: @group.id), alert: "Solo puedes agregar amigos"
    end

    membership = @group.group_memberships.new(user: user)
    if membership.save
      redirect_to messages_path(group_id: @group.id)
    else
      redirect_to messages_path(group_id: @group.id), alert: membership.errors.full_messages.first
    end
  end

  def update
    membership = @group.group_memberships.find(params[:id])
    role = params.dig(:group_membership, :role)

    if role == "leader"
      membership.update(role: :leader)
    end

    redirect_to messages_path(group_id: @group.id)
  end

  def destroy
    membership = @group.group_memberships.find(params[:id])
    is_self_leave = params[:self] == "1" && membership.user_id == current_user.id

    unless is_self_leave || @group.leader?(current_user)
      return head :forbidden
    end

    if membership.leader? && @group.group_memberships.where(role: :leader).count == 1
      next_leader =
        @group.group_memberships
              .where.not(id: membership.id)
              .order(Arel.sql("RANDOM()"))
              .first
      next_leader&.update!(role: :leader)
    end

    membership.destroy
    redirect_to messages_path(group_id: @group.id)
  end

  private

  def set_group
    @group = current_user.groups.find(params[:group_id])
  end

  def ensure_leader
    return if @group.leader?(current_user)

    head :forbidden
  end
end
