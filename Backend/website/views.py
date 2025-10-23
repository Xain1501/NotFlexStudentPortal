#store all the urls for actual functioning of website 
#kinda frontend aspect

#this means it has bunch of routes define inside it,it act as blueprint
 #name of blueprint 
#WHEN WE GO TO SLASH IT WILL CALL FUCNTION
from flask import Blueprint, render_template, request, flash

views = Blueprint('views', __name__)

@views.route('/', methods=['GET', 'POST'])
def home():
    if request.method == 'POST':
        note = request.form.get('note')
        if note:
            flash('Note added successfully!', 'success')
        else:
            flash('Note cannot be empty', 'error')
    
    return render_template("home.html")