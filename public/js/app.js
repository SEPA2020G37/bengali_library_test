$(document).ready(() => {

    // Initialize the general modal which is reused for add books, genres, vendors and coupons
    // by the administrator.
    $('#adminAddArtefactModal').modal({
        show: false,
        backdrop: 'static'
    });

    $('#adminAddArtefactForm').on('submit', (event) => {
        event.preventDefault();
        toggleProcessingAnimation({ state: 'start' });
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
            .then(data => {
                if(data.status){
                    let queryString = new URLSearchParams();
                    queryString.append('offset', '0');
                    let redirect = window.location.origin + '/admin_dashboard?' + queryString.toString();
                    window.location.assign(redirect);  
                }
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

    $('.admin-delete').on('click', function(event){
        event.preventDefault();
        toggleProcessingAnimation({ state: 'start' });
        let id = $(this).data('id');
        let category = $(this).data('category');
        let url = window.location.origin;
        if(category === "book")
            url += "/delete-book?isbn=" + id;
        fetch(url)
        .then(response => {
            if(response) return response.json();
        })
        .then(data => {
            console.log(data);
            if(data.status === "deleted"){
                $(this).parent().parent().parent().remove();
                toggleProcessingAnimation({ state: 'end' });
            }
        })
    });

    $('.admin-edit-submit-button').on('click', function(event){
        event.preventDefault();
        toggleProcessingAnimation({ state: 'start' });
        let url = window.location.origin;
        let category = $(this).data('update-category');
        let formId = $(this).data('value-id');
        let form = document.getElementById(`form-${formId}`);
        let urlSearchParams = new URLSearchParams();
        for(let element of form){
            if(element.type !== "submit")
                urlSearchParams.append(element.name, element.value);
        }
        if(category === "book")
            url += '/update-book';
        fetch(url, {
            method: 'POST',
            body: urlSearchParams,
            credentials: 'same-origin',
        })
        .then(response => {
            return response.json()
        })
        .then(data => {
            let parent = $(`#item-${data.id}`);
            parent.find('[data-type-identifier=title]').text(data.title);
            parent.find('[data-type-identifier=description]').text(data.description.substring(0, 30));
            parent.find('[data-type-identifier=price]').text(data.price);
            if(data.Genres.length)
                parent.find('[data-type-identifier=genre]').text(data.Genres[0].genre);
            parent.find('[data-type-identifier=vendor]').text(data.Vendor.name);
            toggleProcessingAnimation({ state: 'end' });
        })
        .catch(err => {
            if(err) throw err;
        });
    });
});

// Vanilla JS

function toggleProcessingAnimation(obj){
    let spinner = $('.spinner-border');
    let background = $('#admin-master-container');

    if(obj.state === 'start'){
        background.addClass('mask');
        spinner.attr('hidden', false);
    }
    if(obj.state === 'end'){
        background.removeClass('mask');
        spinner.attr('hidden', true);
    }
}