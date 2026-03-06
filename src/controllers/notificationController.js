import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            userId: req.user.userId,
            clinicId: req.user.clinicId
        }).sort({ createdAt: -1 }).limit(50);

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId: req.user.userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.userId, isRead: false },
            { isRead: true }
        );

        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Internal utility to create notifications
export const createNotification = async ({ userId, title, message, type, priority, relatedId, clinicId }) => {
    try {
        const notification = new Notification({
            userId,
            title,
            message,
            type,
            priority,
            relatedId,
            clinicId
        });
        await notification.save();
        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};
