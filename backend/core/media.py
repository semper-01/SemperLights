import mimetypes

from django.core.exceptions import SuspiciousFileOperation
from django.core.files.storage import default_storage
from django.http import FileResponse, Http404
from django.views.decorators.http import require_safe


@require_safe
def serve_media(request, path):
    if (
        not path
        or '\x00' in path
        or '\\' in path
        or any(part in ('.', '..') for part in path.split('/'))
    ):
        raise Http404

    try:
        media_file = default_storage.open(path, 'rb')
    except (FileNotFoundError, IsADirectoryError, SuspiciousFileOperation) as error:
        raise Http404 from error

    content_type = mimetypes.guess_type(path)[0] or 'application/octet-stream'
    return FileResponse(media_file, content_type=content_type)
