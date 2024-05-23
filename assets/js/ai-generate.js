function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        category: params.get('category'),
        type: params.get('type'),
        id: params.get('id')
    };
}

function loadProductData() {
    const { category, type, id } = getQueryParams();
    if (!category) {
        console.error("Category not specified in the URL");
        return;
    }

    const jsonFilePath = `./assets/fakeData/${category}.json`;

    fetch(jsonFilePath)
        .then(response => response.json())
        .then(data => {
            const product = data.products.find(product => product.id === id && product.type === type);
            if (product) {
                updateProductInfo(product);
                // Store product data globally for later use
                window.currentProduct = product;
            } else {
                console.error("Product not found");
            }
        })
        .catch(error => console.error("Error loading JSON file:", error));
}

function updateProductInfo(product) {
    const productName = document.getElementById('api-content_name');
    const productDescription = document.getElementById('api-content_description');
    const productPrice = document.getElementById('api-content_price');
    const productDiscount = document.getElementById('api-content_discount');
    const navCategory = document.getElementById('nav-category');
    const navProduct = document.getElementById('nav-product');
    const colorsList = document.getElementById('api-content_colors');
    const sizesList = document.getElementById('api-content_sizes');
    const detailsList = document.getElementById('api-content_details');
    const instructionsList = document.getElementById('api-content_instructions');
    const gallery = document.getElementById('api-gallery');

    if (productName) productName.textContent = product.name;
    if (productDescription) productDescription.textContent = product.description;
    if (productPrice) productPrice.textContent = `$${product.pricing.sale_price}`;
    if (productDiscount) productDiscount.textContent = `$${product.pricing.regular_price}`;
    if (navCategory) navCategory.textContent = product.category;
    if (navProduct) navProduct.textContent = product.name;

    if (colorsList) {
        colorsList.innerHTML = '';
        product.colors.forEach(color => {
            const li = document.createElement('li');
            li.textContent = color.name;
            colorsList.appendChild(li);
        });
    }

    if (sizesList) {
        sizesList.innerHTML = '';
        product.sizes.forEach(size => {
            const li = document.createElement('li');
            li.textContent = size;
            sizesList.appendChild(li);
        });
    }

    if (detailsList) {
        detailsList.innerHTML = '';
        product.details.material.forEach(material => {
            const li = document.createElement('li');
            li.textContent = material;
            detailsList.appendChild(li);
        });
    }

    if (instructionsList) {
        instructionsList.innerHTML = '';
        product.details.care_instructions.forEach(instruction => {
            const li = document.createElement('li');
            li.textContent = instruction;
            instructionsList.appendChild(li);
        });
    }

    if (gallery) {
        // Eliminar solo las imágenes con la clase 'api-generated'
        const existingImages = gallery.querySelectorAll('img.api-generated');
        existingImages.forEach(img => {
            gallery.removeChild(img);
        });

        product.gallery.forEach(image => {
            const img = document.createElement('img');
            img.src = image.url;
            img.alt = image.alt;
            img.classList.add('api-generated');
            gallery.appendChild(img);
        });
    }
}

function updateGeneratedContent(data) {
    const generatedContainer = document.querySelector('.api-generated_container');
    const preloader = document.getElementById('preloader');
    const generatedImage = document.getElementById('ai-generated_image');
    const scoreLabel = document.getElementById('ai-score_label');
    const generatedOptions = document.querySelector('.generated-options');

    if (generatedImage) {
        generatedImage.src = `data:image/png;base64,${data.image}`;
        generatedImage.onload = () => {
            generatedImage.style.display = 'block';
            if (generatedOptions) generatedOptions.style.display = 'flex';
        };
    }

    document.getElementById('ai-action_download').addEventListener('click', function() {
        const link = document.createElement('a');
        link.href = generatedImage.src;  // Use the src of the generatedImage
        link.download = `trendvr_snap_id_${Math.floor(Math.random() * 10000)}.jpg`;  // The desired filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);  // Clean up by removing the link
    });

    const score = data.score;
    let scoreText = '';
    if (score <= 3) {
        scoreText = 'AI Score Low';
    } else if (score <= 5) {
        scoreText = 'AI Score Average';
    } else {
        scoreText = 'AI Score Excellent';
    }

    if (scoreLabel) {
        scoreLabel.textContent = scoreText;
        scoreLabel.style.display = 'block';
    }

    if (preloader) preloader.style.display = 'none';
    if (generatedContainer) generatedContainer.style.display = 'flex';
}

async function generateAI() {
    const generateButton = document.getElementById('generate');
    const generatedContainer = document.querySelector('.api-generated_container');
    const preloader = document.getElementById('preloader');
    const generatedImage = document.getElementById('ai-generated_image');
    const scoreLabel = document.getElementById('ai-score_label');
    const generatedOptions = document.querySelector('.generated-options');

    if (generateButton) generateButton.style.display = 'none';
    if (generatedContainer) generatedContainer.style.display = 'flex';
    if (preloader) preloader.style.display = 'flex';
    if (generatedImage) generatedImage.style.display = 'none';
    if (scoreLabel) scoreLabel.style.display = 'none';
    if (generatedOptions) generatedOptions.style.display = 'none';

    try {
        const userImageProfile = localStorage.getItem('userImageProfile');
        if (!userImageProfile) {
            throw new Error('No user image profile found in localStorage');
        }

        const product = window.currentProduct;
        if (!product || !product.gallery || product.gallery.length === 0) {
            throw new Error('No product data or gallery available');
        }

        const lastImageUrl = product.gallery[product.gallery.length - 1].url;
        const bodyPart = product.type;

        const response = await fetch(
            // 'http://4.227.140.241:2000/trendvr-ai-service/vto/generate', 
            'http://localhost:3001/generate', 
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                human_image_url: userImageProfile,
                cloth_image_url: lastImageUrl,
                body_part: bodyPart
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log(data)
        updateGeneratedContent(data);
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        // Optionally, you can show some error message to the user here
    }
}

document.getElementById('generate').addEventListener('click', generateAI);
document.getElementById('ai-action_retry').addEventListener('click', generateAI);


// Llama a la función loadProductData cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', loadProductData);

// BD
// BD
// Función para mostrar el loader y deshabilitar el botón
function showLoader(button) {
    button.querySelector('.loader').style.display = 'block';
    document.getElementById('ai-action_share-icon').style.display = 'none';
    button.disabled = true;
}

// Función para ocultar el loader y habilitar el botón
function hideLoader(button) {
    button.querySelector('.loader').style.display = 'none';
    setTimeout(function() {
        document.getElementById('sparkle-share').style.display = 'none';
    }, 1800);
    setTimeout(function() {
        document.getElementById('ai-action_share-icon').style.display = 'flex';
    }, 2000);
    button.disabled = false;
}


async function shareGeneratedImage() {
    const userImageProfile = localStorage.getItem('userImageProfile');
    const product = window.currentProduct;
    const generatedImageSrc = document.getElementById('ai-generated_image').src;
    const scoreLabel = document.getElementById('ai-score_label').textContent;
    const userID = localStorage.getItem('userID'); // Obtener el userID almacenado en el local storage

    if (!userImageProfile || !generatedImageSrc || !product) {
        console.error('Faltan datos necesarios para compartir la imagen');
        return;
    }

    const newEntry = {
        userID: userID,
        userName: "ExampleUserName", // Puedes obtener esto de tu aplicación según corresponda
        name: "ExampleName", // Puedes obtener esto de tu aplicación según corresponda
        userVotes: 0, // Inicialmente puede ser 0 o el valor que necesites
        userImage: generatedImageSrc,
        date: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
        imageScore: scoreLabel
    };

    const shareButton = document.getElementById('ai-action_share');
    showLoader(shareButton);

    try {
        const newEntryKey = firebase.database().ref().child('lens').push().key;
        const updates = {};
        updates['/lens/' + newEntryKey] = newEntry;
        
        await firebase.database().ref().update(updates);
        document.getElementById('sparkle-share').style.display = 'block';
        const element = document.getElementById('sparkle-share');
        const computedStyle = window.getComputedStyle(element);
        const displayProperty = computedStyle.display;
        console.log(displayProperty);

        console.log('Imagen compartida con éxito');
        console.log(document.getElementById('sparkle-share'));
    } catch (error) {
        console.error('Error al compartir la imagen:', error);
    } finally {
        hideLoader(shareButton);
    }
}

document.getElementById('ai-action_share').addEventListener('click', function(event) {
    event.preventDefault(); // Para evitar que el enlace realice la navegación
    shareGeneratedImage();
});
// BD
// BD