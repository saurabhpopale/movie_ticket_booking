/**
 * Prints ONLY the specified ticket element in an isolated iframe.
 * Ensures no other tickets, navbar, footer, or page chrome appear.
 */
export const printSingleTicket = (cardElement: HTMLElement, ticketTitle: string) => {
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '1024px';
    iframe.style.height = '768px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc || !iframe.contentWindow) {
      throw new Error('Unable to access iframe document for printing');
    }

    iframeDoc.title = ticketTitle;

    // Clone all stylesheets and style elements from the main document
    const headElements = document.querySelectorAll('link[rel="stylesheet"], style');
    headElements.forEach((node) => {
      iframeDoc.head.appendChild(node.cloneNode(true));
    });

    // Custom print styles for ticket isolation
    const printStyles = iframeDoc.createElement('style');
    printStyles.textContent = `
      @page {
        size: auto;
        margin: 12mm;
      }
      * {
        box-sizing: border-box;
      }
      html, body {
        background-color: #f8f9fd !important;
        margin: 0 !important;
        padding: 24px !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }
      .no-print {
        display: none !important;
      }
      .ticket-print-wrapper {
        max-width: 820px;
        margin: 0 auto;
      }
    `;
    iframeDoc.head.appendChild(printStyles);

    // Clone the card element and remove interactive buttons
    const clonedCard = cardElement.cloneNode(true) as HTMLElement;
    clonedCard.querySelectorAll('.no-print').forEach((el) => el.remove());

    const wrapper = iframeDoc.createElement('div');
    wrapper.className = 'ticket-print-wrapper';
    wrapper.appendChild(clonedCard);
    iframeDoc.body.appendChild(wrapper);

    // Wait for fonts and styles to calculate, then trigger print
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (printErr) {
        console.error('Error during iframe print, falling back:', printErr);
        fallbackPrint(cardElement);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 350);
  } catch (err) {
    console.error('Failed to print via iframe, falling back to window print:', err);
    fallbackPrint(cardElement);
  }
};

/**
 * Fallback print mechanism directly in current window
 */
const fallbackPrint = (cardElement: HTMLElement) => {
  const previousId = cardElement.id;
  cardElement.id = 'active-print-ticket';
  document.body.classList.add('print-single-ticket');

  const cleanup = () => {
    document.body.classList.remove('print-single-ticket');
    if (previousId) {
      cardElement.id = previousId;
    } else {
      cardElement.removeAttribute('id');
    }
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);
  window.print();
  // Backup cleanup in case afterprint does not fire
  setTimeout(cleanup, 2000);
};

/**
 * Downloads ONLY the specified ticket element as a high-resolution PNG image.
 */
export const downloadTicketImage = async (
  cardElement: HTMLElement,
  filename: string
) => {
  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(cardElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    ignoreElements: (element) => element.classList.contains('no-print'),
    logging: false,
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
