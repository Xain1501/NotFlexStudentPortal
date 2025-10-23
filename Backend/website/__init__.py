#website folder --> python package
#whatever insides it will run automatically 
from flask import Flask 
def create_app():
    app = Flask(__name__)# just initliazing
    app.config['SECRET_KEY'] = 'sonnadasaikotomoshitanainoyo'
    #this is a secret key use for encryption for securing cookies and 
    #session data
    #it could be a sentence or one char
    from .views import views
    from .auth import auth
    app.register_blueprint(views,url_prefix='/')
    app.register_blueprint(auth,url_prefix='/signup.html')#anything in these files will be 
    #prefixed with / in this case it will be /hello
    
    return app

 