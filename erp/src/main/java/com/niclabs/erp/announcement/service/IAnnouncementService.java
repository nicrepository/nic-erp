package com.niclabs.erp.announcement.service;

import com.niclabs.erp.announcement.dto.AnnouncementRequestDTO;
import com.niclabs.erp.announcement.dto.AnnouncementResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

/**
 * Contract for announcement (mural) lifecycle management.
 *
 * <p>Publishing an announcement triggers an asynchronous mass e-mail notification
 * to all registered users. An optional image may be attached to each announcement.</p>
 */
public interface IAnnouncementService {

    /**
     * Creates and publishes a new announcement.
     *
     * <p>If an image is provided it is stored and its filename is linked to the announcement.
     * All registered users are notified asynchronously via e-mail after publication.</p>
     *
     * @param dto   announcement payload containing title and content
     * @param image optional cover image (may be {@code null} or empty)
     * @return the persisted announcement summary
     */
    AnnouncementResponseDTO createAnnouncement(AnnouncementRequestDTO dto, MultipartFile image);

    /**
     * Returns a paginated list of all announcements ordered by creation time descending.
     *
     * @param pageable pagination and sorting parameters
     * @return page of announcement summaries
     */
    Page<AnnouncementResponseDTO> getAnnouncements(Pageable pageable);
}
