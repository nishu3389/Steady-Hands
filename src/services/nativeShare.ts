/**
 * Native share/save for the generated steadiness card image.
 *
 * Two things a browser-only implementation can't actually do inside a
 * packaged Android app's WebView:
 * - Attach an image alongside text when sharing (a `https://wa.me/...` or
 *   `api.whatsapp.com/send` link can only ever prefill text -- there's no
 *   URL scheme for attaching a file, on WhatsApp or anywhere else. The only
 *   way to share text + an image together is the OS share sheet).
 * - Save a file to the gallery. `<a download>` triggers a real download in
 *   a desktop/mobile browser, but does nothing in an Android WebView -- it
 *   has no download manager or gallery integration to hand the file to.
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Media } from '@capacitor-community/media';

const ALBUM_NAME = 'Steady Hands';

async function getOrCreateAlbum(): Promise<string> {
  const { albums } = await Media.getAlbums();
  const existing = albums.find((a) => a.name === ALBUM_NAME);
  if (existing) return existing.identifier;

  await Media.createAlbum({ name: ALBUM_NAME });
  const { albums: refreshed } = await Media.getAlbums();
  const created = refreshed.find((a) => a.name === ALBUM_NAME);
  if (!created) throw new Error(`Could not create/find the "${ALBUM_NAME}" album`);
  return created.identifier;
}

/**
 * Saves the card image to the device's gallery, in its own "Steady Hands"
 * album. Only needs the app's own-album access, which this plugin grants
 * without any runtime storage permission on modern Android.
 */
export async function saveCardToGallery(dataUrl: string, fileName: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Native save is only available in the packaged app.');
  }
  const albumIdentifier = await getOrCreateAlbum();
  await Media.savePhoto({ path: dataUrl, albumIdentifier, fileName });
}

/**
 * Shares the card image + text via the native OS share sheet (so the user
 * can pick WhatsApp, or anything else, with the image actually attached).
 * The Share plugin can only share files that live under the app's cache
 * directory, so the base64 image is written there first.
 */
export async function shareCardNatively(dataUrl: string, fileName: string, text: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Native share is only available in the packaged app.');
  }

  const base64Data = dataUrl.split(',')[1] || dataUrl;
  await Filesystem.writeFile({
    path: fileName,
    data: base64Data,
    directory: Directory.Cache,
  });
  const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });

  await Share.share({
    text,
    files: [uri],
    dialogTitle: 'Share your Steadiness Card',
  });
}
