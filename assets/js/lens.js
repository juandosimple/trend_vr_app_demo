document.addEventListener("DOMContentLoaded", () => {
  async function getSharedImages() {
    try {
      const snapshot = await firebase.database().ref("/lens").once("value");
      const data = snapshot.val();
      const images = [];
      for (const userId in data) {
        for (const imageId in data[userId]) {
          images.push({ ...data[userId][imageId], userId, imageId });
        }
      }

      const imageContainer = document.getElementById("imageContainer");
      imageContainer.innerHTML = "";

      images.forEach((imageData) => {
        const card = document.createElement("div");
        card.className = "image-card col-6 col-lg-3";

        const imgElement = document.createElement("img");
        imgElement.src = imageData.userImage;
        imgElement.alt = imageData.name;
        imgElement.addEventListener("click", () => openModal(imageData));

        const info = document.createElement("div");
        info.className = "info";
        info.innerHTML = `<p>@${imageData.userName}</p>`;
        const heart = document.createElement("div");
        heart.className = "heart-info";
        heart.innerHTML = `<p><i data-feather="heart"></i><span>${imageData.userVotes}</span></p>`;

        card.appendChild(imgElement);
        card.appendChild(info);
        card.appendChild(heart);
        imageContainer.appendChild(card);
        feather.replace();
      });
    } catch (error) {
      console.error("Error al obtener las imágenes compartidas:", error);
    }
  }

  function openModal(imageData) {
    const modalImage = document.getElementById("modalImage");
    modalImage.src = imageData.userImage;

    const voteButton = document.getElementById("voteButton");
    voteButton.onclick = () => voteImage(imageData);

    const whatsappShareButton = document.getElementById("whatsappShareButton");
    whatsappShareButton.href = `https://wa.me/?text=Check out this image: ${imageData.userImage}`;

    //const downloadButton = document.getElementById("downloadButton");
    //downloadButton.href = imageData.userImage;
    //downloadButton.download = `${imageData.name}.png`;

    const imageModal = new bootstrap.Modal(
      document.getElementById("imageModal")
    );
    imageModal.show();
  }

  function voteImage(imageData) {
    const voteButton = document.getElementById("voteButton");
    voteButton.disabled = true;

    const imageRef = firebase
      .database()
      .ref(`/lens/${imageData.userId}/${imageData.imageId}`);
    imageRef
      .transaction((currentData) => {
        if (currentData) {
          currentData.userVotes = (currentData.userVotes || 0) + 1;
        }
        console.log("voted");

        // Mostrar y reproducir la animación
        const animationContainer = document.getElementById(
          "vote-container_animation"
        );
        animationContainer.style.display = "flex";

        const player = document.getElementById("vote-animation");
        player.stop();
        player.play();

        return currentData;
      })
      .then(() => {
        getSharedImages();
        voteButton.classList.add("voted");
      })
      .catch((error) => {
        console.error("Error al registrar el voto:", error);
      })
      .finally(() => {
        voteButton.disabled = false;
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const player = document.getElementById("vote-animation");
    player.addEventListener("complete", () => {
      player.stop();
    });
  });

  getSharedImages();
});
