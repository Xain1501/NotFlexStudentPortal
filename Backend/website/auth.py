from flask import Blueprint, render_template, request, flash, redirect, url_for

auth = Blueprint('auth', __name__, template_folder='templates')

@auth.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Add your login logic here later
        flash('Login functionality not yet implemented', 'error')
        return redirect(url_for('auth.login'))
    return render_template("login.html")

@auth.route('/logout')
def logout():
    # Add logout logic here later
    flash('Logged out successfully', 'success')
    return redirect(url_for('auth.login'))

@auth.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        # Add your signup logic here later
        flash('Signup functionality not yet implemented', 'error')
        return redirect(url_for('auth.signup'))
    return render_template("signup.html")