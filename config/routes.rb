Rails.application.routes.draw do
  get "/profiles/:id", to: "profiles#show", as: :public_profile

  # ✅ tu perfil (sin id)
  get  "/profile", to: "profiles#me", as: :profile
  patch "/profile", to: "profiles#update"

  # (opcional) si no usas edit propio, bórralo:
  # get "/profile/edit", to: "profiles#edit", as: :edit_profile
  # ✅ búsqueda de usuarios (Turbo Frame)
  get "/search/users", to: "users#search", as: :search_users

  # ✅ seguir / dejar de seguir (por id)
  post   "/users/:id/follow", to: "follows#create",  as: :user_follow
  delete "/users/:id/follow", to: "follows#destroy", as: :user_unfollow

  # ✅ mensajes (solo entre amigos)
  get  "/messages", to: "messages#index", as: :messages
  post "/messages/:user_id", to: "messages#create", as: :user_messages

  resources :posts, only: [:new, :create] do
    resources :comments, only: [:create, :destroy]
    resources :users, only: [:show]
    resource :like, only: [:create, :destroy]
  end
  resources :stories, only: [:create]

  devise_for :users

  authenticated :user do
    root "feed#index", as: :authenticated_root
  end

  unauthenticated do
    root to: redirect("/users/sign_in")
  end

  get "feed", to: "feed#index"
end
