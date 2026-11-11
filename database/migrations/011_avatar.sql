-- Profile photo: the file lives in httpdocs/uploads/avatars/<id>.jpg, the version changes on every
-- upload so browsers do not keep showing the old picture. 0 means no photo.

ALTER TABLE users ADD COLUMN avatar_version INT UNSIGNED NOT NULL DEFAULT 0;
