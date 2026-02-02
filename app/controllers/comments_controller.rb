class CommentsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_post

  def create
  @post = Post.find(params[:post_id])
  @comment = @post.comments.build(comment_params)
  @comment.user = current_user

  if @comment.save
    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to root_path }
    end
  else
    respond_to do |format|
      format.turbo_stream do
        render turbo_stream: turbo_stream.replace(
          "comment_error_post_#{@post.id}",
          partial: "comments/error",
          locals: { comment: @comment }
        )
      end
      format.html { redirect_to root_path, alert: "Comentario vacío" }
    end
  end
end


  def destroy
    @comment = @post.comments.find(params[:id])
    return head :forbidden unless @comment.user_id == current_user.id

    @comment.destroy
    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to root_path, notice: "Comentario eliminado ✅" }
    end
  end

  private

  def set_post
    @post = Post.find(params[:post_id])
  end

  def comment_params
    params.require(:comment).permit(:body)
  end
end
