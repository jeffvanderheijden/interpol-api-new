-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Gegenereerd op: 18 jun 2026 om 08:41
-- Serverversie: 10.6.23-MariaDB-0ubuntu0.22.04.1
-- PHP-versie: 8.4.19

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `api_interpol`
--

-- --------------------------------------------------------

--
-- Tabelstructuur voor tabel `challenges`
--

CREATE TABLE `challenges` (
  `id` int(11) NOT NULL,
  `name` varchar(256) NOT NULL,
  `description` text DEFAULT NULL,
  `time_limit` int(6) NOT NULL DEFAULT 0,
  `minimum_points` int(11) NOT NULL DEFAULT 100,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Gegevens worden geëxporteerd voor tabel `challenges`
--

INSERT INTO `challenges` (`id`, `name`, `description`, `time_limit`, `minimum_points`, `is_active`) VALUES
(1, 'Creative Coding', 'Los de creative coding puzzel op', 600, 150, 1),
(2, 'JavaScript', 'Voltooi de JavaScript training', 900, 200, 1),
(3, 'HTML/CSS', 'Voltooi alle HTML/CSS opdrachten', 0, 100, 1),
(4, 'Kijk op de wijk', 'Verken de wijk en los de opdracht op', 0, 100, 1);

-- --------------------------------------------------------

--
-- Tabelstructuur voor tabel `class_challenges`
--

CREATE TABLE `class_challenges` (
  `id` int(11) NOT NULL,
  `class` varchar(16) NOT NULL,
  `challenge_id` int(11) NOT NULL,
  `is_open` tinyint(1) NOT NULL DEFAULT 0,
  `opened_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Gegevens worden geëxporteerd voor tabel `class_challenges`
--

INSERT INTO `class_challenges` (`id`, `class`, `challenge_id`, `is_open`, `opened_at`) VALUES
(1, 'D1A', 1, 1, NULL),
(2, 'D1C', 1, 1, NULL),
(3, 'D1C', 2, 0, NULL),
(4, 'D1B', 3, 0, NULL),
(5, 'D1D', 3, 0, NULL),
(8, 'D1A', 2, 0, NULL),
(9, 'D1A', 3, 0, NULL),
(20, 'D1B', 1, 1, NULL),
(24, 'D1B', 2, 0, NULL);

-- --------------------------------------------------------

--
-- Tabelstructuur voor tabel `groups`
--

CREATE TABLE `groups` (
  `id` int(11) NOT NULL,
  `name` varchar(256) NOT NULL,
  `image_url` varchar(256) DEFAULT NULL,
  `class` varchar(16) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Gegevens worden geëxporteerd voor tabel `groups`
--

INSERT INTO `groups` (`id`, `name`, `image_url`, `class`, `created_at`) VALUES
(6, 'Test team 1', 'https://api.heijden.sd-lab.nl/uploads/groups/group_1765263699986.png', 'D1A', '2025-11-20 08:36:19'),
(8, 'Hakkende Hackers', 'https://api.heijden.sd-lab.nl/uploads/groups/group_1765198048554.png', 'D1C', '2025-11-20 09:38:02'),
(13, 'Test team', 'https://api.heijden.sd-lab.nl/uploads/groups/group_1765201335701.png', 'D1D', '2025-12-08 13:42:15'),
(14, 'Test', 'https://api.heijden.sd-lab.nl/uploads/groups/group_1765883449587.png', 'D1B', '2025-12-16 11:10:49'),
(15, 'Team met echte member', 'https://api.heijden.sd-lab.nl/uploads/groups/group_1766060845912.png', 'D1B', '2025-12-18 12:27:25');

-- --------------------------------------------------------

--
-- Tabelstructuur voor tabel `group_challenges`
--

CREATE TABLE `group_challenges` (
  `id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `challenge_id` int(11) NOT NULL,
  `completed` tinyint(1) DEFAULT 0,
  `points` int(11) DEFAULT NULL,
  `point_deduction` int(11) DEFAULT 0,
  `keycode` varchar(32) NOT NULL,
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Gegevens worden geëxporteerd voor tabel `group_challenges`
--

INSERT INTO `group_challenges` (`id`, `group_id`, `challenge_id`, `completed`, `points`, `point_deduction`, `keycode`, `completed_at`) VALUES
(16, 6, 1, 0, 200, 0, '66039e8835909a1b', NULL),
(17, 6, 2, 0, NULL, 0, '9b0eda0692956fa9', NULL),
(18, 6, 3, 0, NULL, 0, 'eadd61df0f304986', NULL),
(22, 8, 1, 0, 100, 0, '3ef09fdd42f7715b', NULL),
(23, 8, 2, 0, NULL, 0, '90d57eb66cfc0c52', NULL),
(24, 8, 3, 0, NULL, 0, 'fa81fabf39822269', NULL),
(37, 13, 1, 0, NULL, 0, 'dd60d5ceabaee138', NULL),
(38, 13, 2, 0, NULL, 0, '149d7fcf32a7f2bb', NULL),
(39, 13, 3, 0, NULL, 0, 'b2d6f67be5beb583', NULL),
(40, 14, 1, 0, NULL, 0, '6d87f0f5cd6d2f82', NULL),
(41, 14, 2, 0, NULL, 0, 'b7410520eaad94f0', NULL),
(42, 14, 3, 0, NULL, 0, '9bf0d3080bf8c0e5', NULL),
(43, 15, 1, 0, NULL, 0, 'd30a29b4856e9213', NULL),
(44, 15, 2, 0, NULL, 0, '1e0f062e2419d0ab', NULL),
(45, 15, 3, 0, NULL, 0, '2688424960e59b57', NULL);

-- --------------------------------------------------------

--
-- Tabelstructuur voor tabel `group_members`
--

CREATE TABLE `group_members` (
  `id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `name` varchar(128) NOT NULL,
  `student_number` varchar(16) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Gegevens worden geëxporteerd voor tabel `group_members`
--

INSERT INTO `group_members` (`id`, `group_id`, `name`, `student_number`) VALUES
(16, 6, 'sdlkfj', '293829'),
(17, 6, 'slkdfj', '198928'),
(18, 6, 'lskdfjlksdjf', '192819'),
(22, 8, 'defg', '232323'),
(24, 8, 'hijk', '111223'),
(31, 8, 'abc', '234234'),
(43, 13, 'Test', '213423'),
(44, 13, 'ALSFDJ', '123123'),
(45, 13, 'liejkfi', '321234'),
(46, 14, 'asdf', '234234'),
(47, 14, 'asdfsadf', '234444'),
(48, 14, 'aaaaa', '234222'),
(49, 15, 'asfdasd', '199999'),
(50, 15, 'asdfasdf', '222222'),
(51, 15, 'aaaa', '334343');

-- --------------------------------------------------------

--
-- Tabelstructuur voor tabel `student_challenge_scores`
--

CREATE TABLE `student_challenge_scores` (
  `id` int(11) NOT NULL,
  `student_number` varchar(16) NOT NULL,
  `challenge_id` int(11) NOT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `duration_seconds` int(11) DEFAULT NULL,
  `points` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Tabelstructuur voor tabel `student_tutorial_progress`
--

CREATE TABLE `student_tutorial_progress` (
  `id` int(11) NOT NULL,
  `student_number` varchar(16) NOT NULL,
  `completed_at` datetime DEFAULT NULL,
  `points` int(11) NOT NULL DEFAULT 100,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Tabelstructuur voor tabel `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `title` varchar(120) NOT NULL,
  `body` text NOT NULL,
  `media_type` enum('none','image','video') NOT NULL DEFAULT 'none',
  `media_url` varchar(255) DEFAULT NULL,
  `publish_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Gegevens worden geëxporteerd voor tabel `messages`
--

INSERT INTO `messages` (`id`, `title`, `body`, `media_type`, `media_url`, `publish_at`, `created_at`, `updated_at`) VALUES
(5, 'Welkom, student', 'Dit is jouw persoonlijke werkomgeving. Hier vind je updates over verdachte, kun je scores bijhouden en heb je toegang tot de laatste challenges.', 'image', '/uploads/messages/1770038464902-ljb8ragt69i.png', '2026-02-03 08:00:00', '2026-02-02 14:21:04', '2026-02-03 08:11:08'),
(6, 'test', 'test', 'none', NULL, '2026-03-17 12:00:00', '2026-03-17 14:59:39', NULL);

--
-- Indexen voor geëxporteerde tabellen
--

--
-- Indexen voor tabel `challenges`
--
ALTER TABLE `challenges`
  ADD PRIMARY KEY (`id`);

--
-- Indexen voor tabel `class_challenges`
--
ALTER TABLE `class_challenges`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_class_challenge` (`class`,`challenge_id`),
  ADD KEY `challenge_id` (`challenge_id`);

--
-- Indexen voor tabel `groups`
--
ALTER TABLE `groups`
  ADD PRIMARY KEY (`id`);

--
-- Indexen voor tabel `group_challenges`
--
ALTER TABLE `group_challenges`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_team_challenge` (`group_id`,`challenge_id`),
  ADD KEY `fk_group_challenges_challenge` (`challenge_id`);

--
-- Indexen voor tabel `group_members`
--
ALTER TABLE `group_members`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_group_members_group` (`group_id`);

--
-- Indexen voor tabel `student_challenge_scores`
--
ALTER TABLE `student_challenge_scores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_student_challenge` (`student_number`,`challenge_id`),
  ADD KEY `idx_challenge_id` (`challenge_id`);

--
-- Indexen voor tabel `student_tutorial_progress`
--
ALTER TABLE `student_tutorial_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_student_tutorial` (`student_number`);

--
-- Indexen voor tabel `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_messages_created` (`created_at`);

--
-- AUTO_INCREMENT voor geëxporteerde tabellen
--

--
-- AUTO_INCREMENT voor een tabel `challenges`
--
ALTER TABLE `challenges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT voor een tabel `class_challenges`
--
ALTER TABLE `class_challenges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT voor een tabel `groups`
--
ALTER TABLE `groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT voor een tabel `group_challenges`
--
ALTER TABLE `group_challenges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT voor een tabel `group_members`
--
ALTER TABLE `group_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT voor een tabel `student_challenge_scores`
--
ALTER TABLE `student_challenge_scores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT voor een tabel `student_tutorial_progress`
--
ALTER TABLE `student_tutorial_progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT voor een tabel `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Beperkingen voor geëxporteerde tabellen
--

--
-- Beperkingen voor tabel `class_challenges`
--
ALTER TABLE `class_challenges`
  ADD CONSTRAINT `class_challenges_ibfk_1` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`id`) ON DELETE CASCADE;

--
-- Beperkingen voor tabel `group_challenges`
--
ALTER TABLE `group_challenges`
  ADD CONSTRAINT `fk_group_challenges_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_group_challenges_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE;

--
-- Beperkingen voor tabel `group_members`
--
ALTER TABLE `group_members`
  ADD CONSTRAINT `fk_group_members_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE;

--
-- Beperkingen voor tabel `student_challenge_scores`
--
ALTER TABLE `student_challenge_scores`
  ADD CONSTRAINT `fk_student_challenge_scores_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
