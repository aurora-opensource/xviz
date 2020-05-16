/*
 * Copyright (c) 2012 David Rodrigues
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

#ifndef XVIZ_LOGGER_H_
#define XVIZ_LOGGER_H_

#include <time.h>
#include <string.h>

// === auxiliar functions
static inline char *xviz_timenow();

#define XVIZ_NO_LOGS         0x00
#define XVIZ_ERROR_LEVEL     0x01
#define XVIZ_WARNING_LEVEL   0x02
#define XVIZ_INFO_LEVEL      0x03
#define XVIZ_DEBUG_LEVEL     0x04

#ifndef XVIZ_LOG_LEVEL
#define XVIZ_LOG_LEVEL   XVIZ_DEBUG_LEVEL
#endif


#define XVIZ_PRINTFUNCTION(format, ...)      fprintf(stderr, format, __VA_ARGS__)


#define XVIZ_LOG_FMT             "%s %-10s "
#define XVIZ_LOG_ARGS(LOG_TAG)   xviz_timenow(), LOG_TAG

#define XVIZ_NEWLINE     "\n"

#define XVIZ_ERROR_TAG    "[ERROR]"
#define XVIZ_WARNING_TAG  "[WARNING]"
#define XVIZ_INFO_TAG     "[INFO]"
#define XVIZ_DEBUG_TAG    "[DEBUG]"

#if XVIZ_LOG_LEVEL >= XVIZ_DEBUG_LEVEL
#define XVIZ_LOG_DEBUG(message, args...)     XVIZ_PRINTFUNCTION(XVIZ_LOG_FMT message XVIZ_NEWLINE, XVIZ_LOG_ARGS(XVIZ_DEBUG_TAG), ## args)
#else
#define XVIZ_LOG_DEBUG(message, args...)
#endif

#if XVIZ_LOG_LEVEL >= XVIZ_INFO_LEVEL
#define XVIZ_LOG_INFO(message, args...)      XVIZ_PRINTFUNCTION(XVIZ_LOG_FMT message XVIZ_NEWLINE, XVIZ_LOG_ARGS(XVIZ_INFO_TAG), ## args)
#else
#define XVIZ_LOG_INFO(message, args...)
#endif

#if XVIZ_LOG_LEVEL >= XVIZ_WARNING_LEVEL
#define XVIZ_LOG_WARNING(message, args...)      XVIZ_PRINTFUNCTION(XVIZ_LOG_FMT message XVIZ_NEWLINE, XVIZ_LOG_ARGS(XVIZ_WARNING_TAG), ## args)
#else
#define XVIZ_LOG_WARNING(message, args...)
#endif

#if XVIZ_LOG_LEVEL >= XVIZ_ERROR_LEVEL
#define XVIZ_LOG_ERROR(message, args...)     XVIZ_PRINTFUNCTION(XVIZ_LOG_FMT message XVIZ_NEWLINE, XVIZ_LOG_ARGS(XVIZ_ERROR_TAG), ## args)
#else
#define XVIZ_LOG_ERROR(message, args...)
#endif

#if XVIZ_LOG_LEVEL >= XVIZ_NO_LOGS
#define XVIZ_LOG_IF_ERROR(condition, message, args...) if (condition) XVIZ_PRINTFUNCTION(XVIZ_LOG_FMT message XVIZ_NEWLINE, XVIZ_LOG_ARGS(XVIZ_ERROR_TAG), ## args)
#else
#define XVIZ_LOG_IF_ERROR(condition, message, args...)
#endif

static inline char *xviz_timenow() {
    static char buffer[64];
    time_t rawtime;
    struct tm *timeinfo;
    
    time(&rawtime);
    timeinfo = localtime(&rawtime);
    
    strftime(buffer, 64, "%Y-%m-%d %H:%M:%S", timeinfo);
    
    return buffer;
}

#endif