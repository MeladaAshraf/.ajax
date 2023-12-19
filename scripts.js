let isEditMode = false; // Переменная для отслеживания режима (Создать/Редактировать)
let postIdToEdit = null; // Id поста для редактирования
const usersData = []; // Данные пользователей
let maxPostId = 0;

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme); // Применяем сохраненную тему при загрузке страницы
    }
});

// Получение списка постов и их отображение с лоадером
const loader = document.getElementById('loader');
loader.style.display = 'block'; // Показать лоадер

// Получение списка постов
const postsPromise = fetch("https://jsonplaceholder.typicode.com/posts")
    .then(response => response.json())
    .catch(error => {
        loader.style.display = 'none'; // Скрыть лоадер в случае ошибки
        console.error('Ошибка при получении данных о постах:', error);
    });

// Получение списка пользователей
const usersPromise = fetch("https://jsonplaceholder.typicode.com/users")
    .then(response => response.json())
    .catch(error => {
        loader.style.display = 'none'; // Скрыть лоадер в случае ошибки
        console.error('Ошибка при получении данных о пользователях:', error);
    });

// Обработка результатов обоих запросов
Promise.all([postsPromise, usersPromise])
    .then(([posts, users]) => {

        // Обработка данных о пользователях
        const userSelect = document.getElementById("userNameSelect");
        users.forEach(user => {
            usersData[user.id] = user;
            let option = document.createElement("option");
            option.text = user.name;
            userSelect.add(option);
        });

        // Обработка данных о постах
        posts.forEach(jsonPost => displayPost(jsonPost));

        loader.style.display = 'none'; // Скрыть лоадер после получения данных
    });

// Изменение темы
const toggleThemeBtn = document.getElementById('toggleThemeBtn');
const body = document.body;

// Обработчик клика на кнопку "Сменить тему"
toggleThemeBtn.addEventListener('click', function () {
    if (body.classList.contains('dark-theme')) {
        body.classList.remove('dark-theme');
        saveTheme('light'); // Сохраняем выбранную тему в localStorage
    } else {
        body.classList.add('dark-theme');
        saveTheme('dark'); // Сохраняем выбранную тему в localStorage
    }
});// Обработчик клика на кнопку "Создать пост"
const openCreatePostModalBtn = document.getElementById('openCreatePostModal');
openCreatePostModalBtn.addEventListener('click', openPostModal);

// Обработчики клика на кнопки закрытия модальных окон
const closePostModalBtn = document.getElementById('closePostModal');
closePostModalBtn.addEventListener('click', closePostModal);

// Обработчик клика на кнопку закрытия модального окна подтверждения
const closeConfirmModalBtn = document.getElementById('closeConfirmModal');
closeConfirmModalBtn.addEventListener('click', closeConfirmModal);

// Обработчик клика на кнопку отмены удаления
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
cancelDeleteBtn.addEventListener('click', closeConfirmModal);

// Обработчик клика на кнопку подтверждения удаления
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
confirmDeleteBtn.addEventListener('click', () => {
    deleteImportantPost(postIdToEdit);
    closeConfirmModal();
});

// Функция для сохранения выбранной темы в localStorage
function saveTheme(theme) {
    localStorage.setItem('theme', theme);
}

// Функция для применения выбранной темы
function applyTheme(theme) {
    body.classList.toggle('dark-theme', theme === 'dark'); // Применяем класс в зависимости от выбранной темы
}

// Функция для отображения поста
function displayPost(jsonPost) {
    if (jsonPost.id > maxPostId) maxPostId = jsonPost.id;
    const postsList = document.querySelector('.posts-list');
    const importantPostList = document.querySelector('.important-posts-list');
    const postElement = document.createElement('div');
    postElement.dataset.id = jsonPost.id; //Запись id в пост
    postElement.dataset.userId = jsonPost.userId;
    const btnsBox = document.createElement('div');
    btnsBox.className = 'btns-box';
    const importantBtn = document.createElement('button');
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Удалить';
    deleteBtn.className = 'delete-btn';
    const userInfo = usersData[jsonPost.userId]
    postElement.classList.add('post');

    postElement.innerHTML = `
    <h1 class="post-user-name">${userInfo.name}</h1>
    <h3 class="post-title">${jsonPost.title}</h3>
    <p class="post-body">${jsonPost.body}</p>
  `;

    postElement.addEventListener('click', () => {
        if (event.target.tagName !== 'BUTTON') {
            document.getElementById('userNameSelect').selectedIndex = postElement.dataset.userId - 1;
            document.getElementById('postTitle').value = postElement.querySelector('.post-title').textContent;
            document.getElementById('postContent').value = postElement.querySelector('.post-body').textContent;
            postIdToEdit = jsonPost.id;
            openPostModal(true);
        }
    });

    deleteBtn.addEventListener('click', () => {
        deletePost(jsonPost.id);
    })

    //Проверка, находится ли пост в важном
    if (postInImportant(jsonPost.id)) {
        setRemoveImportantBtn(importantBtn, jsonPost.id);
        importantPostList.appendChild(postElement);
    } else {
        setAddImportantBtn(importantBtn, jsonPost.id);
        postsList.appendChild(postElement);
    }
    btnsBox.appendChild(deleteBtn);
    btnsBox.appendChild(importantBtn);
    postElement.appendChild(btnsBox);

}

// Устанавливает кнопке функционал "Добавить в важное" с соответствующим postId
function setAddImportantBtn(btn, postId) {
    btn.textContent = 'Добавить в важное';
    btn.className = 'add-important-btn';
    btn.addEventListener('click', () => {
        addToImportant(postId);
    });
}

// Устанавливает кнопке функционал "Убрать из важного" с соответствующим postId
function setRemoveImportantBtn(btn, postId) {
    btn.textContent = 'Убрать из важного';
    btn.className = 'remove-important-btn';
    btn.addEventListener('click', () => {
        removeFromImportant(postId);
    });
}

// Добавляет postId в localStorage в массив важных постов и обновляет интерфейс, если пост был отображен
function addToImportant(postId) {
    let arr = JSON.parse(localStorage.getItem('important')) || [];
    arr.push(postId);
    localStorage.setItem('important', JSON.stringify(arr));

    const post = getPostById('.posts-list', postId);
    if (post !== null) {
        displayNewPost('.posts-list', postId);
    }
}

// Удаляет postId из массива важных постов в localStorage и обновляет интерфейс, если пост был отображен
function removeFromImportant(postId) {
    if (localStorage.getItem('important') == null) return;
    let arr = JSON.parse(localStorage.getItem('important'));
    let newArr = arr.filter(value => value !== postId);
    localStorage.setItem('important', JSON.stringify(newArr));

    displayNewPost('.important-posts-list', postId);
}

// Обновляет отображение поста с указанным postId в соответствующем списке (важные/обычные)
function displayNewPost(selector, postId) {
    const post = getPostById(selector, postId);
    if (post !== null) {
        const jsonPost = {
            title: post.querySelector('.post-title').textContent,
            body: post.querySelector('.post-body').textContent,
            id: Number(post.dataset.id),
            userId: Number(post.dataset.userId),
        }

        document.querySelector(selector).removeChild(post);
        displayPost(jsonPost);
    }
}

// Проверяет, находится ли postId в списке важных постов в localStorage
function postInImportant(postId) {
    if (localStorage.getItem('important') == null) return;
    let arr = JSON.parse(localStorage.getItem('important'));
    return arr.includes(postId);
}

// Получает элемент поста по его ID (postId) в заданном селекторе
function getPostById(selector, postId) {
    const list = document.querySelector(selector);
    const elements = list.children;
    let foundElement = null;
    // Перебираем все элементы и ищем соответствие dataset.id заданному ID
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (element.dataset.id == postId) {
            foundElement = element;
            break;
        }
    }
    return foundElement;
}

// Функция открытия модального окна для создания/редактирования поста
function openPostModal(isEdit) {
    const modal = document.getElementById('postModal');
    modal.style.display = 'block';
    isEditMode = isEdit;
}

// Функция закрытия модального окна для создания/редактирования поста
function closePostModal() {
    const modal = document.getElementById('postModal');
    modal.style.display = 'none';
    isEditMode = false;

    document.getElementById('userNameSelect').selectedIndex = 0;
    document.getElementById('postTitle').value = "";
    document.getElementById('postContent').value = "";
}

// Открывает модальное окно подтверждения удаления поста с указанным postId
function openConfirmModal(postId) {
    postIdToEdit = postId;
    const modal = document.getElementById('confirmModal');
    modal.style.display = 'block';
}

// Закрывает модальное окно подтверждения удаления поста
function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    modal.style.display = 'none';
}

// Получает информацию о посте из модального окна
function getPostInfoFromModal() {
    const user = document.getElementById('userNameSelect');
    const postTitle = document.getElementById('postTitle');
    const postContent = document.getElementById('postContent');

    return {
        title: postTitle.value,
        body: postContent.value,
        userId: user.selectedIndex + 1,
    };
}

// Обработчик нажатия кнопки "Сохранить" в модальном окне для создания/редактирования поста
const saveBtn = document.getElementById('savePostBtn');
saveBtn.addEventListener('click', () => {
    event.preventDefault();
    savePost();
    closePostModal();
})

// Сохраняет информацию о посте: создает новый или редактирует существующий
function savePost() {
    let postInfo = getPostInfoFromModal();
    if (postInfo === null) return;

    if (isEditMode === true) editPost(postInfo);
    else createPost(postInfo);

}

// Создает новый пост на основе переданных данных и отображает его
function createPost(postInfo) {
    const jsonPost = {
        title: postInfo.title,
        body: postInfo.body,
        userId: postInfo.userId,
        id: ++maxPostId,
    };
    displayPost(jsonPost);
}

// Редактирует существующий пост на основе переданных данных
function editPost(postInfo) {
    if (postIdToEdit === null) return;

    let post;
    if (postInImportant(postIdToEdit))
        post = getPostById('.important-posts-list', postIdToEdit);
    else
        post = getPostById('.posts-list', postIdToEdit);
    editPostData(post, postInfo);
}

// Обновляет данные поста на основе переданных данных
function editPostData(post, data) {
    post.querySelector('.post-title').textContent = data.title;
    post.querySelector('.post-body').textContent = data.body;
    post.querySelector('.post-user-name').textContent = usersData[data.userId].name;
    post.dataset.userId = data.userId;
}

// Удаляет пост из обычного списка или открывает модальное окно подтверждения удаления для важного поста
function deletePost(postId) {
    if (postInImportant(postId))
        openConfirmModal(postId);
    else {
        document.querySelector('.posts-list').removeChild(getPostById('.posts-list', postId));
    }
}

// Удаляет важный пост из списка важных постов
function deleteImportantPost(postId) {
    document.querySelector('.important-posts-list').removeChild(getPostById('.important-posts-list', postId));
}
