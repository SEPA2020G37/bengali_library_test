$(document).ready(() => {

    // Initialize the general modal which is reused for add books, genres, vendors and coupons
    // by the administrator.
    $('#adminAddArtefactModal').modal({
        show: false,
        backdrop: 'static'
    });

    $('#adminAddArtefactForm').on('submit', (event) => {
        event.preventDefault();
        const addForm = document.getElementById('adminAddArtefactForm');
        const artefactType = addForm.dataset.modalsource;
        let url = window.location.origin;
        let formData = new FormData(addForm);
        if(artefactType === 'book'){
            url += '/add-book';
            fetch(url, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
            })
            .then(response => {
                if(response) return response.json();
            })
            .then(books => {
                // TODO - update the booklist with the returned list.
                $('#adminAddArtefactModal').modal('hide');
            })
            .catch(err => {
                throw err;
            })
        }
    });

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

    // Event listner for the admin dashbaord sidebar toggle button
    // This toggles the sidebar display eitherto show or hide it
    if(url.includes('/admin_dashboard')){
        $('.admin-sidebar-toggler').click((e) => { 
            $('.sidebar').toggleClass('sidebar-show');
            $('.data-section').toggleClass('data-section-retract');
            $('.admin-sidebar-toggler').toggleClass('admin-sidebar-toggler-active');
        });
    }
});