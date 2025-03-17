document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("generarBtn").addEventListener("click", generarImagen);
    document.getElementById("printButton").addEventListener("click", imprimirImagen);
    document.getElementById("status").style.display = "none"; // Asegúrate de que el estado de carga esté oculto inicialmente
});

async function generarImagen() {
    document.getElementById("status").style.display = "block";
    document.getElementById("generarBtn").disabled = true;
    const respuestas = [
        document.getElementById("input1").value.trim(),
        document.getElementById("input2").value.trim(),
        document.getElementById("input3").value.trim(),
        document.getElementById("input4").value.trim()
    ];

    if (respuestas.some(r => r === "")) {
        alert("Todos los campos son obligatorios.");
        document.getElementById("status").style.display = "none";
        document.getElementById("generarBtn").disabled = false;
        return;
    }

    try {
        const response = await fetch("/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ respuestas })
        });

        const data = await response.json();
        if (data.image_url) {
            document.getElementById("outputImage").src = data.image_url;
            document.getElementById("outputImage").style.display = "block";
            document.getElementById("printButton").style.display = "block";
            document.getElementById("status").style.display = "none";
        } else {
            throw new Error("No se pudo obtener la imagen");
        }
    } catch (error) {
        console.error("Error generando la imagen:", error);
        document.getElementById("status").style.display = "none";
    } finally {
        document.getElementById("generarBtn").disabled = false;
    }
}

function imprimirImagen() {
    const imageUrl = document.getElementById("outputImage").src;
    if (imageUrl) {
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`<img src="${imageUrl}" style="width:100%;">`);
        printWindow.document.close();
        printWindow.print();
    } else {
        alert("No hay imagen para imprimir.");
    }
}