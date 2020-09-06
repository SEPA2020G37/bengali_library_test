$(document).ready(() => {
    const url = window.location.href;

    // Check if the password and confirmation password are the same before
    // submitting the user registration form.
    if(url.includes('/register')){
        $('#register-form').one('submit', (event) => {
            event.preventDefault();
            if($('input[name="password"]').val() === $('input[name="passwordConfirm"]').val()){
                $(this).submit();
            }else{
                let warningLabel = document.createElement('div');
                let warning = document.createElement('p');
                $('input[name="password"]').val("");
                $('input[name="passwordConfirm"]').val("");
                warningLabel.classList.add('warning-message-banner');
                warning.innerHTML = 'Your password and confirmation password do not match';
                warningLabel.appendChild(warning);
                $('.background').before(warningLabel);
            }
        });
    }
});