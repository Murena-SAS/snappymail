/**
 * Modified version of https://github.com/Bernardo-Castilho/dragdroptouch
 * This is to only support Firefox Mobile.
 * Because touchstart must call preventDefault() to prevent scrolling
 * but then it doesn't work native in Chrome on Android
 */

(doc => {
	'use strict';

	let dropEffect = 'move',
		effectAllowed = 'all',
		data = {};
/*
	class DataTransferItem
	{
		get kind() { return 'string'; }
	}
*/
	/** https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer */
	class DataTransfer
	{
		get dropEffect() { return dropEffect; }
		set dropEffect(value) { dropEffect = value; }

		get effectAllowed() { return effectAllowed; }
		set effectAllowed(value) { effectAllowed = value; }

		get files() { return []; }
		get items() { return []; } // DataTransferItemList
		get types() { return Object.keys(data); }

		clearData(type) {
			if (type != null) {
				delete data[type];
			} else {
				data = {};
			}
		}

		getData(type) {
			return data[type] || '';
		}

		setData(type, value) {
			data[type] = value;
		}

		setDragImage(img, xOffset, yOffset) {
			imgCustom = img;
			imgOffset = { x: xOffset, y: yOffset };
		}
	}

	let dataTransfer,
		dragSource,
		isDragging,
		allowDrop,
		lastTarget,
		lastTouch,
		pressHoldInterval;

	const
		// copy styles/attributes from drag source to drag image element
		rmvAtts = 'id,class,style,draggable'.split(','),
		kbdProps = 'altKey,ctrlKey,metaKey,shiftKey'.split(','),
		ptProps = 'pageX,pageY,clientX,clientY,screenX,screenY,offsetX,offsetY'.split(',');

	// clear all members
	function reset() {
		destroyImage();
		dragSource = lastTouch = lastTarget = dataTransfer = null;
		isDragging = allowDrop = false;
		clearInterval(pressHoldInterval);
	}

	// ignore events that have been handled or that involve more than one touch
	function shouldHandle(e) {
		return e && !e.defaultPrevented && e.touches && e.touches.length < 2;
	}

	// get point for a touch event
	function getPoint(e) {
		if (e && e.touches) {
			e = e.touches[0];
		}
		return { x: e.clientX, y: e.clientY };
	}

	function touchstart(e) {
		if (shouldHandle(e)) {
			// clear all variables
			reset();

			// get nearest draggable element
			let src = e.target.closest('[draggable]');
			if (src) {
				// get ready to start dragging
				dragSource = src;
				lastTouch = e;
				e.preventDefault(); // prevent scrolling NOTE: this creates a bug that click will not work

				// 1000 ms to wait, chrome on android triggers dragstart in 600
				pressHoldInterval = setTimeout(e => {
					// start dragging
					if (dragSource && !isDragging) {
						isDragging = true;
						let target = getTarget(e);
						dataTransfer = new DataTransfer();
						dispatchEvent(e, 'dragstart', dragSource);
						createImage(e);
						dispatchEvent(e, 'dragenter', target);
					}
				}, 1000);
			}
		}
	}

	function touchmove(e) {
		if (isDragging) {
			let target = getTarget(e);
			// continue dragging
			if (isDragging) {
				lastTouch = e;
				e.preventDefault(); // prevent scrolling
				if (target != lastTarget) {
					dispatchEvent(lastTouch, 'dragleave', lastTarget);
					dispatchEvent(e, 'dragenter', target);
					lastTarget = target;
				}
				moveImage(e);
				allowDrop = dispatchEvent(e, 'dragover', target);
			}
		} else {
			reset();
			return;
		}
	}

	function touchend(e) {
		if (shouldHandle(e)) {
			if (!isDragging) {
				// touched the element but didn't drag, so simulate a click
				dispatchEvent(lastTouch, 'click', e.target);
			}
			// finish dragging
			if (dragSource) {
				if (allowDrop && !e.type.includes('cancel')) {
					dispatchEvent(lastTouch, 'drop', lastTarget);
				}
				dispatchEvent(lastTouch, 'dragend', dragSource);
				reset();
			}
		}
	}

	// get the element at a given touch event
	function getTarget(e) {
		let pt = getPoint(e), el = doc.elementFromPoint(pt.x, pt.y);
		while (el && getComputedStyle(el).pointerEvents == 'none') {
			el = el.parentElement;
		}
		return el;
	}

	let img, imgCustom, imgOffset;

	// create drag image from source element
	function createImage(e) {
		// just in case...
		destroyImage();
		// create drag image from custom element or drag source
		let src = imgCustom || dragSource;
		img = src.cloneNode(true);
		copyStyle(src, img);
		let style = img.style;
		style.top = style.left = '-9999px';
		style.position = 'fixed';
		style.pointerEvents = 'none';
		style.zIndex = '999999999';
		// if creating from drag source, apply offset and opacity
		if (!imgCustom) {
			imgOffset = { x: src.clientWidth / 2, y: src.clientHeight / 2 };
			style.opacity = 0.75;
		}
		// add image to document
		moveImage(e);
		doc.body.appendChild(img);
	}

	// dispose of drag image element
	function destroyImage() {
		img && img.parentElement && img.remove();
		img = imgCustom = null;
	}

	// move the drag image element
	function moveImage(e) {
		requestAnimationFrame(() => {
			if (img) {
				let pt = getPoint(e), s = img.style;
				s.left = Math.round(pt.x - imgOffset.x) + 'px';
				s.top = Math.round(pt.y - imgOffset.y) + 'px';
			}
		});
	}

	// copy properties from an object to another
	function copyProps(dst, src, props) {
		for (let i = 0; i < props.length; i++) {
			let p = props[i];
			dst[p] = src[p];
		}
	}

	function copyStyle(src, dst) {
		// remove potentially troublesome attributes
		rmvAtts.forEach(function (att) {
			dst.removeAttribute(att);
		});
		// copy canvas content
		if (src instanceof HTMLCanvasElement) {
			let cSrc = src, cDst = dst;
			cDst.width = cSrc.width;
			cDst.height = cSrc.height;
			cDst.getContext('2d').drawImage(cSrc, 0, 0);
		}
		// copy style (without transitions)
		let cs = getComputedStyle(src), i;
		for (i = 0; i < cs.length; i++) {
			let key = cs[i];
			if (key.indexOf('transition') < 0) {
				dst.style[key] = cs[key];
			}
		}
		dst.style.pointerEvents = 'none';
		// and repeat for all children
		for (i = 0; i < src.children.length; i++) {
			copyStyle(src.children[i], dst.children[i]);
		}
	}

	function dispatchEvent(e, type, target) {
		if (e && target) {
			let evt = new Event(type, {bubbles:true,cancelable:true});
			evt.button = 0;
			evt.which = evt.buttons = 1;
			copyProps(evt, e, kbdProps);
			copyProps(evt, e.touches ? e.touches[0] : e, ptProps);
			if (isDragging) {
				evt.dataTransfer = dataTransfer;
			}
			return !target.dispatchEvent(evt);
		}
		return false;
	}

	// Chrome on mobile supports drag & drop
	let ua = navigator.userAgent.toLowerCase();
	if (ua.includes("mobile") && ua.includes('gecko/')) {
		let opt = { passive: false, capture: false };
		doc.addEventListener('touchstart', touchstart, opt);
		doc.addEventListener('touchmove', touchmove, opt);
		doc.addEventListener('touchend', touchend);
		doc.addEventListener('touchcancel', touchend);
	}

})(document);
