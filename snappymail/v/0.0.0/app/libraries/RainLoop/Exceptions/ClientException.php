<?php

namespace RainLoop\Exceptions;

/**
 * @category RainLoop
 * @package Exceptions
 */
class ClientException extends \RuntimeException
{
	/**
	 * @var string
	 */
	private $sAdditionalMessage;

	public function __construct(int $iCode, ?\Throwable $oPrevious = null, string $sAdditionalMessage = '')
	{
		parent::__construct(
			\RainLoop\Notifications::GetNotificationsMessage($iCode, $oPrevious),
			$iCode,
			$oPrevious
		);
		$this->sAdditionalMessage = $sAdditionalMessage ?: ($oPrevious ? $oPrevious->getMessage() : '');
	}

	public function getAdditionalMessage() : string
	{
		return $this->sAdditionalMessage;
	}

	public function __toString() : string
	{
		$message = $this->getMessage();
		if ($this->sAdditionalMessage) {
			$message .= " ({$this->sAdditionalMessage})";
		}
		return "{$message}\r\n{$this->getFile()}#{$this->getLine()}\r\n{$this->getTraceAsString()}";
	}
}
